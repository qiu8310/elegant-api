import {EaOptions, EaMocksOptions, EaHttpOptions, EaMockOptions} from './options';
export * from './options';

export default function(eaOptions: EaOptions, mocks?: EaMocksOptions): any {

}

export interface EaApiFunction {
  (data?: Object, config?: {

    http?: EaHttpOptions;
    mock?: EaMockOptions;
    debug?: boolean;
    cache?: string | boolean;

  }): any;
}
