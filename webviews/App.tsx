import React, { useEffect, useState } from 'react';
import { view } from '@risingstack/react-easy-state';
import currencyStore from './currencyStore';
import { fetchLatestRates } from './service';

function App() {
  const [time, setTime] = useState(new Date());
  const { currentCurrency, updateCurrentCurrency } = currencyStore;
  const [rates, setRates] = useState<{[k: string]: number}>({});

  useEffect(() => {
    window.addEventListener(`message`, ev => {
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

  useEffect(() => {
    if (currentCurrency) {
      fetchLatestRates(currentCurrency).then((resp) => {
        setRates(resp.rates);
      })
    }
  }, [currentCurrency]);

  useEffect(() => {
    const task = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(task);
    };
  }, [setTime]);

  return <>
    <h1>Hello World!</h1>
    <code>{time.toLocaleString()}</code>
    <h2>Selected: <code>{currentCurrency || `none`}</code></h2>
    <table>
      <tbody>
        {Object.entries(rates).map((i) => {
          return <tr key={i[0]}>
          <td>{i[0]}</td>
          <td>{i[1] as number}</td>
        </tr>
        })}
      </tbody>
    </table>
  </>;
}

export default view(App);
