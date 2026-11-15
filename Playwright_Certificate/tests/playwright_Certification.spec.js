// @ts-check
import { test, expect } from '@playwright/test';

const playgroundUrl = '/selenium-playground/';
const observations = new WeakMap();

test.beforeEach(async ({ page }) => {
  const network = [];
  const console = [];

  page.on('request', (request) => {
    network.push({
      type: 'request',
      method: request.method(),
      url: request.url(),
    });
  });
  page.on('response', (response) => {
    network.push({
      type: 'response',
      status: response.status(),
      url: response.url(),
    });
  });
  page.on('requestfailed', (request) => {
    network.push({
      type: 'requestfailed',
      error: request.failure()?.errorText,
      url: request.url(),
    });
  });
  page.on('console', (message) => {
    console.push({
      type: message.type(),
      text: message.text(),
    });
  });
  page.on('pageerror', (error) => {
    console.push({
      type: 'pageerror',
      text: error.message,
    });
  });

  observations.set(page, { network, console });
});

test.afterEach(async ({ page }, testInfo) => {
  const logs = observations.get(page);

  if (!logs) {
    return;
  }

  await testInfo.attach('network-log', {
    body: JSON.stringify(logs.network, null, 2),
    contentType: 'application/json',
  });
  await testInfo.attach('console-log', {
    body: JSON.stringify(logs.console, null, 2),
    contentType: 'application/json',
  });
});

test('Simple Form Demo echoes the entered message', async ({ page }) => {
  await page.goto(playgroundUrl);
  await page.getByRole('link', { name: 'Simple Form Demo', exact: true }).click();
  await expect(page).toHaveURL(/simple-form-demo/);
  await page.waitForLoadState('networkidle');

  const message = 'Welcome to TestMu AI';
  await page.getByPlaceholder('Please enter your Message').fill(message);
  await page.getByRole('button', { name: 'Get Checked Value' }).click();

  await expect(page.locator('#message')).toHaveText(message);
});

test('Drag & Drop Sliders sets Default value 15 to 95', async ({ page }) => {
  await page.goto(playgroundUrl);
  await page.getByRole('link', { name: 'Drag & Drop Sliders', exact: true }).click();
  await page.waitForLoadState('networkidle');

  const slider = page.locator('#slider3 input[type="range"]');
  const rangeValue = page.locator('#rangeSuccess');
  await expect(slider).toHaveValue('15');
  await expect(rangeValue).toHaveText('15');

  const bounds = await slider.boundingBox();
  if (!bounds) {
    throw new Error('The Default value 15 slider is not visible.');
  }

  const thumbInset = Math.min(8, bounds.width / 10);
  const trackWidth = bounds.width - thumbInset * 2;
  /** @param {number} value */
  const valueToX = (value) => bounds.x + thumbInset + ((value - 1) / 99) * trackWidth;
  const centerY = bounds.y + bounds.height / 2;

  await page.mouse.move(valueToX(15), centerY);
  await page.mouse.down();
  await page.mouse.move(valueToX(94.5), centerY, { steps: 20 });
  await page.mouse.up();

  await expect(slider).toHaveValue('95');
  await expect(rangeValue).toHaveText('95');
});

test('Input Form Submit validates required fields and accepts a complete form', async ({ page }) => {
  await page.goto(playgroundUrl);
  await page.getByRole('link', { name: 'Input Form Submit', exact: true }).click();
  await page.waitForLoadState('networkidle');

  const nameInput = page.getByPlaceholder('Name', { exact: true });
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  expect(await nameInput.evaluate((input) => input.checkValidity())).toBe(false);

  const validationMessage = await nameInput.evaluate((input) => input.validationMessage);
  expect(validationMessage).toBeTruthy();

  await nameInput.fill('Taylor Tester');
  await page.getByPlaceholder('Email', { exact: true }).fill('taylor.tester@example.com');
  await page.getByPlaceholder('Password', { exact: true }).fill('Playwright123!');
  await page.getByPlaceholder('Company', { exact: true }).fill('Example Company');
  await page.getByPlaceholder('Website', { exact: true }).fill('https://example.com');
  await page.getByRole('combobox').selectOption({ label: 'United States' });
  await page.getByPlaceholder('City', { exact: true }).fill('Seattle');
  await page.getByPlaceholder('Address 1', { exact: true }).fill('123 Test Street');
  await page.getByPlaceholder('Address 2', { exact: true }).fill('Suite 4');
  await page.getByPlaceholder('State', { exact: true }).fill('Washington');
  await page.getByPlaceholder('Zip code', { exact: true }).fill('98101');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();

  await expect(
    page.getByText('Thanks for contacting us, we will get back to you shortly.', { exact: true }),
  ).toBeVisible();
});
