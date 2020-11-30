import React, { useEffect } from 'react';
import { view } from '@risingstack/react-easy-state';
import currencyStore from './currencyStore';

function App() {
  const { currentCurrency, updateCurrentCurrency } = currencyStore;

  useEffect(() => {
    window.addEventListener(`message`, (ev) => {
      const { type, value } = ev.data;
      switch (type) {
        case `UPDATE_CURRENCY`: {
          updateCurrentCurrency(value);
          break;
        }
        default:
          console.log(type, value);
          break;
      }
    });
  }, [updateCurrentCurrency]);

  return (
    <>
      <h1>Hello World!</h1>
      <h2>Selected: </h2>
      <pre>{JSON.stringify(currentCurrency)}</pre>
    </>
  );
}

export default view(App);
