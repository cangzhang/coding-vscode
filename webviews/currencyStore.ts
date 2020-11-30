import { store } from '@risingstack/react-easy-state';

const currency = store({
  currentCurrency: null,
  updateCurrentCurrency(k: any) {
    currency.currentCurrency = k;
  },
});

export default currency;
