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

    // Input placeholder is "My Project", label is "Project Name"
    const nameInput = page.getByLabel('Project Name').first();
    await nameInput.fill('E2E Project');

    // Submit button label is "Create Project"
    await page.getByRole('button', { name: /create project/i }).first().click();

    await expectToast(page, /project created/i);
    await expect(page.getByText('E2E Project').first()).toBeVisible({ timeout: 5_000 });
  });

  test('edit a project', async ({ page }) => {
    // Create first
    await page.getByRole('button', { name: /new project/i }).first().click();
    await page.getByLabel('Project Name').first().fill('Project to Edit');
    await page.getByRole('button', { name: /create project/i }).first().click();
    await expectToast(page, /project created/i);

    // Edit it — edit button has aria-label="Edit project"
    const card = page.locator('div').filter({ hasText: 'Project to Edit' }).first();
    await card.getByRole('button', { name: /edit project/i }).first().click();

    const editInput = page.getByLabel('Project Name').first();
    await editInput.clear();
    await editInput.fill('Renamed Project');
    // Submit label is "Save"
    await page.getByRole('button', { name: /^save$/i }).first().click();

    await expectToast(page, /project updated/i);
    await expect(page.getByText('Renamed Project').first()).toBeVisible({ timeout: 5_000 });
  });

  test('delete a project', async ({ page }) => {
    // Create first
    await page.getByRole('button', { name: /new project/i }).first().click();
    await page.getByLabel('Project Name').first().fill('Project to Delete');
    await page.getByRole('button', { name: /create project/i }).first().click();
    await expectToast(page, /project created/i);

    // Register dialog BEFORE clicking delete
    page.once('dialog', (d) => d.accept());

    const card = page.locator('div').filter({ hasText: 'Project to Delete' }).first();
    await card.getByRole('button', { name: /delete project/i }).first().click();
    await page.waitForTimeout(500);

    await expectToast(page, /project deleted/i);
    await expect(page.getByText('Project to Delete')).not.toBeVisible({ timeout: 5_000 });
  });

  test('project shows note count', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).first().click();
    await page.getByLabel('Project Name').first().fill('Count Project');
    await page.getByRole('button', { name: /create project/i }).first().click();
    await expectToast(page, /project created/i);

    // Should show "0 notes" or similar
    const card = page.locator('[data-testid="project-card"]').filter({ hasText: 'Count Project' }).first();
    await expect(card.getByText(/\d+ notes?/i)).toBeVisible();
  });

  test('linking a note to a project increments note count', async ({ page }) => {
    const projectName = `Linked Note Project ${Date.now()}`;

    // Create a project
    await page.getByRole('button', { name: /new project/i }).first().click();
    await page.getByLabel('Project Name').first().fill(projectName);
    await page.getByRole('button', { name: /create project/i }).first().click();
    await expectToast(page, /project created/i);

    // Get the workspace ID and project ID via API
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

    // Reload the projects page to pick up the updated count
    await page.reload();
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-testid="project-card"]').filter({ hasText: projectName }).first();
    await expect(card.getByText('1 notes')).toBeVisible({ timeout: 5_000 });
  });

  test('empty project name shows validation error', async ({ page }) => {
    await page.getByRole('button', { name: /new project/i }).first().click();
    // Submit without filling the name
    await page.getByRole('button', { name: /create project/i }).first().click();

    await expectToast(page, /project name is required/i);
  });
});
