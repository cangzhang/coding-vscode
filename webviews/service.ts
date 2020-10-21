import ky from 'ky';

interface LatestRatesResp {
  amount: number;
  base: string;
  date: string;
  rates: {
    [k: string]: number;
  }
}

export const fetchLatestRates = async (k: string) => {
  try {
    const resp: LatestRatesResp = await ky.get(`https://api.frankfurter.app/latest?from=${k}`).json()
    return resp;
  } catch (err) {
    throw new Error(err);
  }
}
