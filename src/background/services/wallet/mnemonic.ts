import { MnemonicWallet } from '@avalabs/avalanche-wallet-sdk';
import { Subject, from, combineLatest } from 'rxjs';
import { mapTo, mergeMap, startWith } from 'rxjs/operators';
import { saveMnemonicToStorage } from './storage';

const _mnemonic = new Subject<{ mnemonic: string; password: string }>();

export const mnemonic = _mnemonic.pipe(
  // this is a hack to make it work on the background while testing
  startWith({
    mnemonic: '',
    password: 'test',
  }),
  mergeMap(({ mnemonic, password }) => {
    return from(saveMnemonicToStorage(mnemonic, password)).pipe(
      mapTo(mnemonic)
    );
  })
);

export function createMnemonicWallet(mnemonic: string) {
  return MnemonicWallet.fromMnemonic(mnemonic);
}

export function setMnemonicAndCreateWallet(mnem: string, password: string) {
  _mnemonic.next({ mnemonic: mnem, password });
}