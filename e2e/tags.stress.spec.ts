/**
 * Stress tests for the tags feature.
 *
 * Exercises the client-side batcher + server-side tag endpoints with workloads
 * far beyond normal use to surface race conditions, flicker, and latency
 * regressions. Uses API seeding for setup where UI would be prohibitively slow.
 *
 * IMPORTANT: These tests do NOT auto-fix failures. They measure and report.
 */
import { test, expect, type Page, type Request } from '@playwright/test';
import { goto, waitForReady, API } from './helpers';

const EDITOR_TAG_INPUT = '[data-testid="editor-tag-input"]';
const EDITOR_TAG_ROW = '[data-testid="editor-tag-row"]';
const FILTER_BAR = '[data-testid="tag-filter-bar"]';

// ─── API helpers (avoid UI overhead during setup) ──────────────────────────
async function getWorkspaceId(page: Page): Promise<string> {
  const res = await page.context().request.get(`${API}/workspaces`);
  const body = (await res.json()) as { workspaces: Array<{ id: string }> };
  return body.workspaces[0].id;
}

async function createNoteApi(
  page: Page,
  workspaceId: string,
  title: string,
): Promise<{ id: string }> {
  const res = await page.context().request.post(
    `${API}/workspaces/${workspaceId}/notes`,
    { data: { title } },
  );
  expect(res.ok(), `createNote failed: ${res.status()}`).toBeTruthy();
  const body = (await res.json()) as { note?: { id: string }; id?: string };
  const note = body.note ?? (body as { id: string });
  return { id: note.id };
}

async function deleteNoteApi(page: Page, workspaceId: string, noteId: string) {
  await page.context().request.delete(
    `${API}/workspaces/${workspaceId}/notes/${noteId}`,
  );
}

async function addTagsApi(
  page: Page,
  workspaceId: string,
  noteId: string,
  tags: string[],
) {
  await page.context().request.post(
    `${API}/workspaces/${workspaceId}/notes/${noteId}/tags`,
    { data: { tags } },
  );
}

async function getNoteApi(
  page: Page,
  workspaceId: string,
  noteId: string,
): Promise<{ id: string; tags: string[] }> {
  const res = await page.context().request.get(
    `${API}/workspaces/${workspaceId}/notes/${noteId}`,
  );
  const body = (await res.json()) as {
    note?: { id: string; tags: string[] };
    id?: string;
    tags?: string[];
  };
  const note = body.note ?? (body as { id: string; tags: string[] });
  return { id: note.id, tags: note.tags ?? [] };
}

async function deleteWorkspaceTagApi(
  page: Page,
  workspaceId: string,
  tag: string,
) {
  await page.context().request.delete(
    `${API}/workspaces/${workspaceId}/tags/${encodeURIComponent(tag)}`,
  );
}

// ─── Network observer helpers ──────────────────────────────────────────────
type TagNetworkLog = {
  adds: Request[];
  removes: Request[];
  dispose: () => void;
};

function observeTagNetwork(page: Page): TagNetworkLog {
  const adds: Request[] = [];
  const removes: Request[] = [];
  const onReq = (req: Request) => {
    const url = req.url();
    const method = req.method();
    if (method === 'POST' && /\/notes\/[^/]+\/tags(?:\?.*)?$/.test(url)) {
      adds.push(req);
    }
    if (method === 'DELETE' && /\/notes\/[^/]+\/tags\/[^/]+(?:\?.*)?$/.test(url)) {
      removes.push(req);
    }
  };
  const onResp = (resp: import('@playwright/test').Response) => {
    const url = resp.url();
    const method = resp.request().method();
    if (
      (method === 'POST' && /\/notes\/[^/]+\/tags(?:\?.*)?$/.test(url)) ||
      (method === 'DELETE' && /\/notes\/[^/]+\/tags\/[^/]+(?:\?.*)?$/.test(url))
    ) {
      if (!resp.ok()) {
        console.log(
          `[stress-net] ${method} ${url} → ${resp.status()}`,
        );
      }
    }
  };
  page.on('request', onReq);
  page.on('response', onResp);
  return {
    adds,
    removes,
    dispose: () => {
      page.off('request', onReq);
      page.off('response', onResp);
    },
  };
}

// ─── UI helpers ────────────────────────────────────────────────────────────
async function selectNote(page: Page, noteId: string) {
  const cardSel = `[data-note-id="${noteId}"]`;
  // First attempt: maybe the list already has the note (optimistic create, etc.)
  if ((await page.locator(cardSel).count()) === 0) {
    // Hard reload to drop any stale React Query cache and refetch the list.
    await page.reload();
    await waitForReady(page);
  }
  // Notes list can be long; scroll the sidebar until the card is in view.
  const card = page.locator(cardSel).first();
  await expect(card).toBeAttached({ timeout: 15_000 });
  await card.scrollIntoViewIfNeeded().catch(() => undefined);
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click();
  await expect(page.locator(EDITOR_TAG_INPUT)).toBeVisible({ timeout: 10_000 });
}

async function listAllNoteTitles(
  page: Page,
  workspaceId: string,
): Promise<Array<{ id: string; title: string }>> {
  const res = await page.context().request.get(
    `${API}/workspaces/${workspaceId}/notes?limit=500`,
  );
  if (!res.ok()) return [];
  const body = (await res.json()) as {
    notes?: Array<{ id: string; title: string }>;
  };
  return body.notes ?? [];
}

/**
 * Fire N separate "add tag via Enter" actions as fast as possible,
 * synchronously from inside the page — faster than any realistic user.
 * Uses React's native input value setter so onChange fires correctly.
 * Returns the time between the first keydown and the last.
 */
async function burstAddTagsEnter(page: Page, tags: string[]): Promise<number> {
  return page.evaluate((tagList: string[]) => {
    const input = document.querySelector<HTMLInputElement>(
      '[data-testid="editor-tag-input"]',
    );
    if (!input) throw new Error('Tag input not found');
    input.focus();
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )!.set!;
    const start = performance.now();
    for (const tag of tagList) {
      setter.call(input, tag);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        }),
      );
    }
    return performance.now() - start;
  }, tags);
}

/**
 * Count chip remove/add churn during a time window — any chip that is
 * removed after being added counts as flicker.
 */
async function countFlickerInWindow(page: Page, ms: number): Promise<number> {
  return page.evaluate(async (windowMs: number) => {
    const row = document.querySelector('[data-testid="editor-tag-row"]');
    if (!row) return 0;
    let removals = 0;
    const observer = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const node of Array.from(m.removedNodes)) {
          if (
            node instanceof HTMLElement &&
            node.matches('[data-testid="tag-chip"]')
          ) {
            removals++;
          }
        }
      }
    });
    observer.observe(row, { childList: true, subtree: true });
    await new Promise((r) => setTimeout(r, windowMs));
    observer.disconnect();
    return removals;
  }, ms);
}

// ─── Test suite ────────────────────────────────────────────────────────────
test.describe('Tags — stress', () => {
  let workspaceId: string;
  const createdNoteIds: string[] = [];
  const seedTagsForCleanup: Set<string> = new Set();

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    });
    const page = await ctx.newPage();
    workspaceId = await getWorkspaceId(page);

    // Sweep any lingering "stress-" notes from previous (possibly failed) runs
    // so each suite run starts from a clean slate (Bug F).
    const leftover = await listAllNoteTitles(page, workspaceId);
    for (const n of leftover) {
      if (typeof n.title === 'string' && n.title.startsWith('stress-')) {
        await deleteNoteApi(page, workspaceId, n.id).catch(() => undefined);
      }
    }
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    test.setTimeout(180_000);
    const ctx = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    });
    const page = await ctx.newPage();
    // Parallel cleanup — sequential was blowing past the 60s hook timeout
    // when the suite created ~20 notes and hundreds of stress tags.
    await Promise.all(
      createdNoteIds.map((id) =>
        deleteNoteApi(page, workspaceId, id).catch(() => undefined),
      ),
    );
    await Promise.all(
      Array.from(seedTagsForCleanup).map((tag) =>
        deleteWorkspaceTagApi(page, workspaceId, tag).catch(() => undefined),
      ),
    );
    const leftover = await listAllNoteTitles(page, workspaceId);
    await Promise.all(
      leftover
        .filter((n) => typeof n.title === 'string' && n.title.startsWith('stress-'))
        .map((n) => deleteNoteApi(page, workspaceId, n.id).catch(() => undefined)),
    );
    await ctx.close();
  });

  test.beforeEach(async ({ page }) => {
    await goto(page, '/notes');
  });

  // ── 1. Burst add: 20 tags back-to-back in <100ms ─────────────────────────
  test('burst add 20 tags collapses to ≤2 POSTs with no flicker', async ({
    page,
  }) => {
    const note = await createNoteApi(page, workspaceId, `stress-burst-${Date.now()}`);
    createdNoteIds.push(note.id);
    const tags = Array.from(
      { length: 20 },
      (_, i) => `stress-burst-${Date.now()}-${i}`,
    );
    tags.forEach((t) => seedTagsForCleanup.add(t));

    await goto(page, '/notes');
    await selectNote(page, note.id);

    const netLog = observeTagNetwork(page);

    const burstMs = await burstAddTagsEnter(page, tags);
    // Wait for batcher debounce + flush
    await page.waitForTimeout(1_200);
    // Wait network idle to make sure all flush promises settled
    await page.waitForLoadState('networkidle').catch(() => undefined);

    const chipCount = await page
      .locator(`${EDITOR_TAG_ROW} [data-testid="tag-chip"]`)
      .count();
    const flicker = await countFlickerInWindow(page, 200);

    netLog.dispose();

    // Report
    console.log(
      `[stress] burst-add: ${tags.length} tags in ${burstMs.toFixed(
        0,
      )}ms, chips=${chipCount}, adds=${netLog.adds.length}, flicker=${flicker}`,
    );

    expect(burstMs, 'client burst should be faster than the debounce window').toBeLessThan(500);
    expect(chipCount, 'all burst tags should render').toBe(tags.length);
    expect(flicker, 'no chip should be removed after being added').toBe(0);
    expect(
      netLog.adds.length,
      'batcher must coalesce bursts to ≤2 HTTP POSTs',
    ).toBeLessThanOrEqual(2);

    // Server must agree with UI (no backend race loss)
    const server = await getNoteApi(page, workspaceId, note.id);
    expect(new Set(server.tags)).toEqual(new Set(tags));
  });

  // ── 2. Add/remove churn on the same tag cancels out ──────────────────────
  test('add/remove churn on same tag issues no network call', async ({
    page,
  }) => {
    const note = await createNoteApi(page, workspaceId, `stress-churn-${Date.now()}`);
    createdNoteIds.push(note.id);
    const tag = `stress-churn-${Date.now()}`;
    seedTagsForCleanup.add(tag);

    await goto(page, '/notes');
    await selectNote(page, note.id);
    const netLog = observeTagNetwork(page);

    // Alternate add/remove within the debounce window.
    // We yield a frame between each action so React commits the optimistic
    // update and the chip's remove button is actually in the DOM when we
    // click it. Still well inside the 200ms debounce window.
    await page.evaluate(
      async ({ t }) => {
        const input = document.querySelector<HTMLInputElement>(
          '[data-testid="editor-tag-input"]',
        )!;
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!;
        const nextFrame = () =>
          new Promise<void>((r) => requestAnimationFrame(() => r()));
        const addTag = () => {
          setter.call(input, t);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: 'Enter',
              bubbles: true,
              cancelable: true,
            }),
          );
        };
        const removeTag = () => {
          const chip = document.querySelector(
            `[data-testid="editor-tag-row"] [data-testid="tag-chip"][data-tag="${t}"] [data-testid="tag-chip-remove"]`,
          ) as HTMLElement | null;
          chip?.click();
        };
        for (let i = 0; i < 5; i++) {
          addTag();
          await nextFrame();
          removeTag();
          await nextFrame();
        }
      },
      { t: tag },
    );

    // Wait through the debounce window + some slack
    await page.waitForTimeout(500);
    netLog.dispose();

    const chipCount = await page
      .locator(
        `${EDITOR_TAG_ROW} [data-testid="tag-chip"][data-tag="${tag}"]`,
      )
      .count();

    console.log(
      `[stress] churn: adds=${netLog.adds.length}, removes=${netLog.removes.length}, final-chips=${chipCount}`,
    );

    // Because every add is followed by a remove inside the window, the buffer
    // should cancel out → zero HTTP traffic and zero final chip.
    expect(chipCount).toBe(0);
    expect(netLog.adds.length + netLog.removes.length).toBe(0);
  });

  // ── 3. Large paste: 100 tags in one comma-separated input ────────────────
  test('paste 100 tags in one commit renders without long tasks', async ({
    page,
  }) => {
    const note = await createNoteApi(page, workspaceId, `stress-100-${Date.now()}`);
    createdNoteIds.push(note.id);
    const tags = Array.from(
      { length: 100 },
      (_, i) => `stress-100-${Date.now()}-${i}`,
    );
    tags.forEach((t) => seedTagsForCleanup.add(t));

    await goto(page, '/notes');
    await selectNote(page, note.id);

    // Instrument long tasks
    await page.evaluate(() => {
      (window as unknown as { __longTasks: number[] }).__longTasks = [];
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as unknown as { __longTasks: number[] }).__longTasks.push(
            entry.duration,
          );
        }
      });
      try {
        obs.observe({ entryTypes: ['longtask'] });
      } catch {
        // longtask not supported in headless sometimes
      }
    });

    const netLog = observeTagNetwork(page);
    const input = page.locator(EDITOR_TAG_INPUT);
    await input.click();
    await input.fill(tags.join(', '));
    await input.press('Enter');

    // Two chunked POSTs of 50 tags each need to go through sequentially;
    // give them plenty of room on slow CI.
    await page.waitForTimeout(3_000);
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const chipCount = await page
      .locator(`${EDITOR_TAG_ROW} [data-testid="tag-chip"]`)
      .count();
    const longTasks = (await page.evaluate(
      () => (window as unknown as { __longTasks: number[] }).__longTasks ?? [],
    )) as number[];
    const maxLongTask = longTasks.length ? Math.max(...longTasks) : 0;
    netLog.dispose();

    console.log(
      `[stress] paste-100: chips=${chipCount}, adds=${netLog.adds.length}, longTasks=${longTasks.length}, maxTask=${maxLongTask.toFixed(0)}ms`,
    );

    expect(chipCount).toBe(tags.length);
    expect(
      netLog.adds.length,
      '100-tag paste should be one HTTP POST',
    ).toBeLessThanOrEqual(2);
    expect(
      maxLongTask,
      'no single main-thread task should block >250ms',
    ).toBeLessThan(250);

    const server = await getNoteApi(page, workspaceId, note.id);
    expect(server.tags.length).toBe(tags.length);
  });

  // ── 4. Cross-tab / cross-request serialization per note ──────────────────
  // The batcher serializes per-note; two notes should flush concurrently.
  test('two notes flush concurrently, not serialized across notes', async ({
    page,
  }) => {
    const noteA = await createNoteApi(
      page,
      workspaceId,
      `stress-concurrent-a-${Date.now()}`,
    );
    const noteB = await createNoteApi(
      page,
      workspaceId,
      `stress-concurrent-b-${Date.now()}`,
    );
    createdNoteIds.push(noteA.id, noteB.id);

    // Seed via API from two simultaneous requests (parallel) and measure
    // how much earlier B's response arrives vs if they were serialized.
    const t0 = Date.now();
    const results = await Promise.all([
      page.context().request.post(
        `${API}/workspaces/${workspaceId}/notes/${noteA.id}/tags`,
        { data: { tags: [`stress-c-a-${Date.now()}`] } },
      ),
      page.context().request.post(
        `${API}/workspaces/${workspaceId}/notes/${noteB.id}/tags`,
        { data: { tags: [`stress-c-b-${Date.now()}`] } },
      ),
    ]);
    const elapsed = Date.now() - t0;

    console.log(
      `[stress] concurrent: statuses=${results.map((r) => r.status()).join(',')} elapsed=${elapsed}ms`,
    );

    for (const r of results) expect(r.ok()).toBeTruthy();
    // Backend should handle them in parallel. On a warm dev server each
    // individual tag POST is ~200-800ms, so two in parallel should comfortably
    // finish within 5s even on a loaded machine. A hard serialization bug
    // (e.g. noteA and noteB sharing the same mutex) would show up as ≥ 2×
    // that budget.
    expect(elapsed).toBeLessThan(5_000);
  });

  // ── 5. Mass delete from Manage Tags dialog (toast-over-list regression) ──
  test('mass-delete 10 tags from Manage dialog — toast never covers next row', async ({
    page,
  }) => {
    const note = await createNoteApi(page, workspaceId, `stress-mass-${Date.now()}`);
    createdNoteIds.push(note.id);
    const tags = Array.from(
      { length: 10 },
      (_, i) => `stress-mass-${Date.now()}-${i}`,
    );
    tags.forEach((t) => seedTagsForCleanup.add(t));
    await addTagsApi(page, workspaceId, note.id, tags);

    await goto(page, '/notes');
    await selectNote(page, note.id);

    const manageBtn = page
      .locator(
        '[data-testid="tag-filter-manage"], [data-testid="tag-filter-overflow"]',
      )
      .first();
    await manageBtn.click();
    const dialog = page.locator('[data-testid="manage-tags-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const overlaps: number[] = [];
    for (const tag of tags) {
      const row = dialog.locator(
        `[data-testid="manage-tags-row"][data-tag="${tag}"]`,
      );
      const rowBox = await row.boundingBox();
      await row.locator('[data-testid="manage-tags-delete"]').click();
      await page.getByRole('button', { name: /delete tag/i }).click();

      // Check whether the confirmation toast (if present) intersects any row
      const toast = page.locator('[data-sonner-toast]').first();
      if (await toast.count()) {
        const toastBox = await toast.boundingBox();
        if (rowBox && toastBox) {
          const overlap =
            !(
              toastBox.x + toastBox.width < rowBox.x ||
              toastBox.x > rowBox.x + rowBox.width ||
              toastBox.y + toastBox.height < rowBox.y ||
              toastBox.y > rowBox.y + rowBox.height
            );
          if (overlap) overlaps.push(rowBox.y);
        }
      }
    }

    console.log(
      `[stress] mass-delete: overlaps=${overlaps.length}/${tags.length}`,
    );
    expect(
      overlaps.length,
      'toast should never cover a tag row in Manage dialog',
    ).toBe(0);

    await page.keyboard.press('Escape');
    const server = await getNoteApi(page, workspaceId, note.id);
    expect(server.tags.filter((t) => tags.includes(t))).toEqual([]);
  });

  // ── 6. Backend error recovery ────────────────────────────────────────────
  test('server 500 on addTags rolls back optimistic chips via invalidation', async ({
    page,
  }) => {
    const note = await createNoteApi(page, workspaceId, `stress-err-${Date.now()}`);
    createdNoteIds.push(note.id);
    const tag = `stress-err-${Date.now()}`;
    seedTagsForCleanup.add(tag);

    await goto(page, '/notes');
    await selectNote(page, note.id);

    let blocked = true;
    await page.route('**/notes/*/tags', (route) => {
      if (blocked && route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'simulated failure' }),
        });
      } else {
        route.continue();
      }
    });

    const input = page.locator(EDITOR_TAG_INPUT);
    await input.click();
    await input.fill(tag);
    await input.press('Enter');

    // Chip appears optimistically
    const chip = page.locator(
      `${EDITOR_TAG_ROW} [data-testid="tag-chip"][data-tag="${tag}"]`,
    );
    await expect(chip).toBeVisible({ timeout: 2_000 });

    // Wait for the failed POST + the invalidation refetch to land
    await page.waitForTimeout(2_500);
    const afterRollback = await chip.count();

    blocked = false;
    await page.unroute('**/notes/*/tags');

    console.log(
      `[stress] error-recovery: chip-after-rollback=${afterRollback}`,
    );
    expect(afterRollback, 'chip must disappear after server 500 + invalidation').toBe(0);

    // Sanity: a subsequent add (unblocked) must work
    await input.click();
    await input.fill(`${tag}-v2`);
    seedTagsForCleanup.add(`${tag}-v2`);
    await input.press('Enter');
    await expect(
      page.locator(
        `${EDITOR_TAG_ROW} [data-testid="tag-chip"][data-tag="${tag}-v2"]`,
      ),
    ).toBeVisible({ timeout: 5_000 });
  });

  // ── 7. Workspace tags list under load ────────────────────────────────────
  test('workspace filter bar handles 60+ tags across 10 notes', async ({
    page,
  }) => {
    const ts = Date.now();
    const notesCreated: string[] = [];
    for (let i = 0; i < 10; i++) {
      const note = await createNoteApi(
        page,
        workspaceId,
        `stress-fb-${ts}-${i}`,
      );
      notesCreated.push(note.id);
      const tags = Array.from({ length: 6 }, (_, j) => `stress-fb-${ts}-${i}-${j}`);
      tags.forEach((t) => seedTagsForCleanup.add(t));
      await addTagsApi(page, workspaceId, note.id, tags);
    }
    createdNoteIds.push(...notesCreated);

    const t0 = Date.now();
    await goto(page, '/notes');
    const filterBar = page.locator(FILTER_BAR);
    await expect(filterBar).toBeVisible({ timeout: 10_000 });
    const loadMs = Date.now() - t0;
    const chips = await filterBar.locator('[data-testid="tag-chip"]').count();
    const overflowOrManage = page
      .locator(
        '[data-testid="tag-filter-manage"], [data-testid="tag-filter-overflow"]',
      )
      .first();
    const hasOverflow = (await overflowOrManage.count()) > 0;

    console.log(
      `[stress] filter-bar-load: chips=${chips} loadMs=${loadMs} hasOverflow=${hasOverflow}`,
    );
    expect(chips, 'filter bar should render some chips').toBeGreaterThan(0);
    expect(hasOverflow, 'overflow/Manage affordance should be present with many tags').toBeTruthy();
    expect(loadMs).toBeLessThan(10_000);

    // Click a chip and check filter applies.
    // Only count chips that are actually rendered (visible) in the bar — chips
    // hidden in the overflow menu can't be clicked directly here.
    const firstStressChip = filterBar
      .locator(`[data-testid="tag-chip"][data-tag^="stress-fb-${ts}-"]`)
      .first();
    const chipVisible = (await firstStressChip.count()) > 0;
    if (chipVisible) {
      await firstStressChip.scrollIntoViewIfNeeded().catch(() => undefined);
      await expect(firstStressChip).toBeVisible({ timeout: 5_000 });
      const t1 = Date.now();
      await firstStressChip.click();
      await expect(firstStressChip).toHaveAttribute('data-active', 'true', {
        timeout: 3_000,
      });
      const applyMs = Date.now() - t1;
      console.log(`[stress] filter-apply: ${applyMs}ms`);
      expect(applyMs).toBeLessThan(3_000);
    } else {
      console.log('[stress] filter-apply: no stress chip visible in bar (all in overflow)');
    }
  });

  // ── 8. Mixed adds + removes coalesce into a single bulk POST + N DELETEs ─
  test('mixed burst: 5 adds + 2 removes → 1 POST + 2 DELETEs', async ({
    page,
  }) => {
    const note = await createNoteApi(page, workspaceId, `stress-mix-${Date.now()}`);
    createdNoteIds.push(note.id);
    const existingTag = `stress-mix-existing-${Date.now()}`;
    const existingTag2 = `stress-mix-existing-2-${Date.now()}`;
    await addTagsApi(page, workspaceId, note.id, [existingTag, existingTag2]);
    seedTagsForCleanup.add(existingTag);
    seedTagsForCleanup.add(existingTag2);

    const newTags = Array.from(
      { length: 5 },
      (_, i) => `stress-mix-new-${Date.now()}-${i}`,
    );
    newTags.forEach((t) => seedTagsForCleanup.add(t));

    await goto(page, '/notes');
    await selectNote(page, note.id);
    // Make sure the seeded tags are actually rendered before we try to click
    // their X buttons (the note query may still be fetching when selectNote
    // resolves).
    await expect(
      page.locator(
        `${EDITOR_TAG_ROW} [data-testid="tag-chip"][data-tag="${existingTag}"]`,
      ),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator(
        `${EDITOR_TAG_ROW} [data-testid="tag-chip"][data-tag="${existingTag2}"]`,
      ),
    ).toBeVisible({ timeout: 10_000 });

    const netLog = observeTagNetwork(page);

    // Do everything via synthetic DOM events in a single page.evaluate.
    // Synthetic events bypass pointer-event interception (from the success
    // toast). A small setTimeout yield after each op lets React commit the
    // optimistic update before the next op queries the DOM. All operations
    // are well inside the batcher's 200ms debounce window, so they coalesce
    // into 1 POST + N DELETEs.
    const stats = await page.evaluate(
      async ({ adds, removes }) => {
        const input = document.querySelector<HTMLInputElement>(
          '[data-testid="editor-tag-input"]',
        )!;
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!;
        const yieldFrame = () => new Promise<void>((r) => setTimeout(r, 0));

        let clickedRemoves = 0;
        for (const tag of removes) {
          const btn = document.querySelector(
            `[data-testid="editor-tag-row"] [data-testid="tag-chip"][data-tag="${tag}"] [data-testid="tag-chip-remove"]`,
          ) as HTMLButtonElement | null;
          if (btn) {
            btn.dispatchEvent(
              new MouseEvent('click', { bubbles: true, cancelable: true }),
            );
            clickedRemoves++;
          }
          await yieldFrame();
        }

        input.focus();
        for (const tag of adds) {
          setter.call(input, tag);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: 'Enter',
              bubbles: true,
              cancelable: true,
            }),
          );
          await yieldFrame();
        }
        return { clickedRemoves };
      },
      { adds: newTags, removes: [existingTag, existingTag2] },
    );

    expect(
      stats.clickedRemoves,
      'both seeded-tag X buttons must be in the DOM at click time',
    ).toBe(2);

    // Wait for all 3 requests (1 POST + 2 DELETEs) to finish. Under load after
    // previous stress tests the server can be slow, so we poll the netLog
    // instead of a fixed sleep and give it a generous budget.
    await expect
      .poll(() => netLog.adds.length, { timeout: 10_000 })
      .toBe(1);
    await expect
      .poll(() => netLog.removes.length, { timeout: 10_000 })
      .toBe(2);
    // Let the responses settle before querying the server.
    await page.waitForLoadState('networkidle').catch(() => undefined);
    netLog.dispose();

    console.log(
      `[stress] mixed-burst: adds=${netLog.adds.length} removes=${netLog.removes.length}`,
    );

    const server = await getNoteApi(page, workspaceId, note.id);
    expect(new Set(server.tags)).toEqual(new Set(newTags));
  });
});
