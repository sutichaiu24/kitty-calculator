import { test, expect } from '@playwright/test';
import path from 'path';

const PAGE_URL = `file://${path.resolve(__dirname, '..', 'index.html')}`;

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE_URL);
});

// Helper: กดปุ่มตัวเลขทีละตัว
// ปุ่ม '3' มีรูป Hello Kitty ทำให้ accessible name เป็น "Hello Kitty 3" — ต้องใช้ locator พิเศษ
async function pressKeys(page: any, keys: string) {
  for (const k of keys) {
    if (k === '3') {
      await page.locator('.kitty-num').click();
    } else {
      await page.getByRole('button', { name: k, exact: true }).click();
    }
  }
}

// ─────────────────────────────────────────
// TC-01: Page loads
// ─────────────────────────────────────────
test('TC-01: page loads with correct title and 5 currency tabs', async ({ page }) => {
  await expect(page).toHaveTitle('FX Calculator');

  for (const code of ['SGD', 'MYR', 'HKD', 'JPY', 'USD']) {
    await expect(page.getByRole('button', { name: code })).toBeVisible();
  }
});

// ─────────────────────────────────────────
// TC-02: Default state
// ─────────────────────────────────────────
test('TC-02: default state shows SGD selected with zero values', async ({ page }) => {
  await expect(page.locator('#inputAmount')).toHaveText('0');
  await expect(page.locator('#inputCurrency')).toHaveText('SGD');
  await expect(page.locator('#resultAmount')).toHaveText('0.00');
  await expect(page.locator('#rateInfo')).toHaveText('1 SGD = ฿27');
  await expect(page.locator('#currencyName')).toHaveText('Singapore Dollar');
});

// ─────────────────────────────────────────
// TC-03: Numpad input → calculation
// ─────────────────────────────────────────
test('TC-03: pressing 1-0-0 shows 100 SGD = 2,700.00 THB', async ({ page }) => {
  await pressKeys(page, '100');

  await expect(page.locator('#inputAmount')).toHaveText('100');
  await expect(page.locator('#resultAmount')).toHaveText('2,700.00');
});

// ─────────────────────────────────────────
// TC-04: Currency switch
// ─────────────────────────────────────────
test('TC-04: switching to USD updates rate info and recalculates', async ({ page }) => {
  await pressKeys(page, '100');
  await page.getByRole('button', { name: 'USD' }).click();

  await expect(page.locator('#rateInfo')).toHaveText('1 USD = ฿35');
  await expect(page.locator('#inputCurrency')).toHaveText('USD');
  await expect(page.locator('#resultAmount')).toHaveText('3,500.00');
});

// ─────────────────────────────────────────
// TC-05: Each mock rate is correct (input = 1)
// ─────────────────────────────────────────
const RATES: [string, string][] = [
  ['SGD', '27.00'],
  ['MYR', '7.50'],
  ['HKD', '4.60'],
  ['JPY', '0.23'],
  ['USD', '35.00'],
];

for (const [code, expected] of RATES) {
  test(`TC-05: 1 ${code} = ฿${expected}`, async ({ page }) => {
    await page.getByRole('button', { name: code }).click();
    await page.getByRole('button', { name: '1', exact: true }).click();

    await expect(page.locator('#resultAmount')).toHaveText(expected);
  });
}

// ─────────────────────────────────────────
// TC-06: CLEAR button resets input
// ─────────────────────────────────────────
test('TC-06: CLEAR resets input to 0 and result to 0.00', async ({ page }) => {
  await pressKeys(page, '5');
  await expect(page.locator('#inputAmount')).toHaveText('5');

  await page.getByRole('button', { name: 'CLEAR' }).click();

  await expect(page.locator('#inputAmount')).toHaveText('0');
  await expect(page.locator('#resultAmount')).toHaveText('0.00');
});

// ─────────────────────────────────────────
// TC-07: Backspace removes last digit
// ─────────────────────────────────────────
test('TC-07: backspace removes last digit (123 → 12)', async ({ page }) => {
  await pressKeys(page, '123');
  await expect(page.locator('#inputAmount')).toHaveText('123');

  await page.getByRole('button', { name: '⌫' }).click();

  await expect(page.locator('#inputAmount')).toHaveText('12');
});

// ─────────────────────────────────────────
// TC-08: Decimal input calculates correctly
// ─────────────────────────────────────────
test('TC-08: 1.5 SGD = ฿40.50', async ({ page }) => {
  await pressKeys(page, '1');
  await page.getByRole('button', { name: '.', exact: true }).click();
  await pressKeys(page, '5');

  await expect(page.locator('#inputAmount')).toHaveText('1.5');
  await expect(page.locator('#resultAmount')).toHaveText('40.50');
});

// ─────────────────────────────────────────
// TC-09: Double decimal prevention
// ─────────────────────────────────────────
test('TC-09: pressing dot twice is ignored (1..5 → 1.5)', async ({ page }) => {
  await pressKeys(page, '1');
  await page.getByRole('button', { name: '.', exact: true }).click();
  await page.getByRole('button', { name: '.', exact: true }).click(); // ← ควรถูก ignore
  await pressKeys(page, '5');

  await expect(page.locator('#inputAmount')).toHaveText('1.5');
});
