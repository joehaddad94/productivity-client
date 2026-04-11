import { test, expect } from '@playwright/test';
import { goto, expectToast, API } from './helpers';

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/projects');
  });

  test('page loads with Projects heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /projects/i }).first()
    ).toBeVisible();
  });

  test('create a project', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).first().click();

    // Inline create form — input has aria-label="Project name"
    const nameInput = page.getByLabel(/project name/i).first();
    await nameInput.fill('E2E Project');

    await page.getByRole('button', { name: /create project/i }).first().click();

    await expectToast(page, /project created/i);
    await expect(page.getByText('E2E Project').first()).toBeVisible({ timeout: 5_000 });
  });

  test('edit a project', async ({ page }) => {
    // Create first
    await page.getByRole('button', { name: /new project/i }).first().click();
    await page.getByLabel(/project name/i).first().fill('Project to Edit');
    await page.getByRole('button', { name: /create project/i }).first().click();
    await expectToast(page, /project created/i);

    // Wait for toast to clear before interacting with the card
    await page.waitForTimeout(600);

    const card = page.locator('[data-testid="project-card"]').filter({ hasText: 'Project to Edit' }).first();
    // Edit button is opacity-0 until hover — hover first, then force-click
    await card.hover();
    await card.getByRole('button', { name: /edit project/i }).first().click({ force: true });

    // InlineEditForm appears in place of the card
    const editInput = page.getByLabel(/project name/i).first();
    await editInput.clear();
    await editInput.fill('Renamed Project');
    await page.getByRole('button', { name: /^save$/i }).first().click();

    await expectToast(page, /project updated/i);
    await expect(page.getByText('Renamed Project').first()).toBeVisible({ timeout: 5_000 });
  });

  test('delete a project', async ({ page }) => {
    const uniqueName = `Delete Me ${Date.now()}`;

    // Create first
    await page.getByRole('button', { name: /new project/i }).first().click();
    await page.getByLabel(/project name/i).first().fill(uniqueName);
    await page.getByRole('button', { name: /create project/i }).first().click();
    await expectToast(page, /project created/i);

    // Wait for the new card to appear in the list
    const card = page.locator('[data-testid="project-card"]').filter({ hasText: uniqueName }).first();
    await expect(card).toBeVisible({ timeout: 8_000 });

    // Delete button is opacity-0 until hover
    await card.hover();
    await card.getByRole('button', { name: /delete project/i }).first().click({ force: true });

    await expectToast(page, /project deleted/i);
    await expect(
      page.locator('[data-testid="project-card"]').filter({ hasText: uniqueName })
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test('project shows note count', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).first().click();
    await page.getByLabel(/project name/i).first().fill('Count Project');
    await page.getByRole('button', { name: /create project/i }).first().click();
    await expectToast(page, /project created/i);

    const card = page.locator('[data-testid="project-card"]').filter({ hasText: 'Count Project' }).first();
    // Shows "0 notes" by default
    await expect(card.getByText(/\d+ notes?/i)).toBeVisible({ timeout: 5_000 });
  });

  test('linking a note to a project increments note count', async ({ page }) => {
    const projectName = `Linked Note Project ${Date.now()}`;

    // Create a project via UI
    await page.getByRole('button', { name: /new project/i }).first().click();
    await page.getByLabel(/project name/i).first().fill(projectName);
    await page.getByRole('button', { name: /create project/i }).first().click();
    await expectToast(page, /project created/i);

    // Get workspace ID and project ID via API
    const workspaceId = await page.evaluate(() =>
      localStorage.getItem('tasky_current_workspace_id')
    );

    const projectsRes = await page.request.get(`${API}/workspaces/${workspaceId}/projects`);
    const { projects } = await projectsRes.json() as { projects: Array<{ id: string; name: string }> };
    const project = projects.find((p) => p.name === projectName);
    expect(project).toBeTruthy();

    // Create a note linked to the project via API
    await page.request.post(`${API}/workspaces/${workspaceId}/notes`, {
      data: { title: 'Note linked to project', tags: [], projectId: project!.id },
    });

    // Reload to pick up updated count
    await page.reload();
    await page.waitForLoadState('load');
    await page.waitForTimeout(400);

    const card = page.locator('[data-testid="project-card"]').filter({ hasText: projectName }).first();
    await expect(card.getByText(/1 notes?/i)).toBeVisible({ timeout: 5_000 });
  });

  test('empty project name shows validation error', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).first().click();

    // The Create project button is disabled when the name field is empty
    await expect(
      page.getByRole('button', { name: /create project/i }).first()
    ).toBeDisabled();
  });
});
