import ky from 'ky';
import { IRepoInfo } from '../src/typings/commonTypes';
import { IMRDetailResponse } from '../src/typings/respResult';

interface LatestRatesResp {
  amount: number;
  base: string;
  date: string;
  rates: {
    [k: string]: number;
  };
}

export const fetchLatestRates = async (k: string) => {
  try {
    const resp: LatestRatesResp = await ky
      .get(`https://api.frankfurter.app/latest?from=${k}`)
      .json();
    return resp;
  } catch (err) {
    throw new Error(err);
  }
};

export const fetchMRDetail = async (repoInfo: IRepoInfo, iid: string, accessToken: string) => {
  try {
    const resp: IMRDetailResponse = await ky.get(`https://${repoInfo.team}.coding.net/api/user/${repoInfo.team}/project/${repoInfo.project}/depot/${repoInfo.repo}/git/merge/${iid}/detail`, {
      searchParams: {
        access_token: accessToken,
      },
    }).json();

    if (resp.code) {
      return Promise.reject(resp);
    }

    return resp.data;
  } catch (err) {
    return Promise.reject(err);
  }
};
