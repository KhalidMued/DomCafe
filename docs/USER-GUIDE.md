# User Guide

## Guest ordering flow

Open the app at:

```text
http://localhost:11080
```

### 1. Welcome

Guests see:

```text
DŌM
Slow coffee. Deep roots.
Welcome to DŌM. Take your time.
```

Enter a name and select **Start**. The name is saved locally on the guest device for the current browser.

### 2. Menu

The menu page shows:

- Sticky category tabs.
- Drink cards grouped by category.
- Drink photos.
- Drink descriptions.
- Bean used.
- Temperature and milk options when available.

Select **Add to order** on any drink, then select **Review order**.

### 3. Cart

The cart page lets the guest review:

- Guest name.
- Selected drinks.
- Quantity.
- Temperature.
- Milk option.
- Item note.
- General order note.

Select **Submit order** to send it to the bar.

### 4. Order status

After submitting, the guest is sent to:

```text
/order/{order_id}
```

The status page shows:

- Order number.
- Friendly status text.
- Progress stages.
- Ordered items.

The page refreshes order status every 15 seconds until the order is ready or cancelled.
