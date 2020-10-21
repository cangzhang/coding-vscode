import { store } from '@risingstack/react-easy-state';

const currency = store({
  currentCurrency: ``,
  updateCurrentCurrency(k: string) {
    currency.currentCurrency = k;
  }
});

export default currency;
