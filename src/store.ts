import { defineStore } from "pinia"
import { ref, computed } from 'vue'
import { Wallet, TestNetWallet, BaseWallet, Config, BalanceResponse } from "mainnet-js"
import { IndexedDBProvider } from "@mainnet-cash/indexeddb-storage"
import type { TokenData } from "./interfaces/interfaces"

// set mainnet-js config
Config.EnforceCashTokenReceiptAddresses = true;
// @ts-ignore
BaseWallet.StorageProvider = IndexedDBProvider;

const defaultChaingraph = "https://gql.chaingraph.pat.mn/v1/graphql";
const dafaultIpfsGateway = "https://ipfs.io/ipfs/";
const explorerUrlMainnet = "https://explorer.bitcoinunlimited.info";
const explorerUrlChipnet = "https://chipnet.chaingraph.cash";

export const useStore = defineStore('store', () => {
  // Wallet State
  const wallet = ref(null as (Wallet |TestNetWallet | null));
  const balance = ref(undefined as (BalanceResponse | undefined));
  const maxAmountToSend = ref(undefined as (BalanceResponse | undefined));
  const network = computed(() => wallet.value?.network == "mainnet" ? "mainnet" : "chipnet")
  const explorerUrl = computed(() => network.value == "mainnet" ? explorerUrlMainnet : explorerUrlChipnet);
  const tokenList = ref(null as (Array<TokenData> | null))
  const plannedTokenId = ref(undefined as (undefined | string));
  const nrBcmrRegistries = ref(undefined as (number | undefined));

  // Global settings
  const bchUnit = ref("bch" as ("bch" | "sat"));
  const chaingraph = ref(defaultChaingraph);
  const ipfsGateway = ref(dafaultIpfsGateway);
  const darkMode  = ref(false);
  const autoApprove = ref(['wc_authRequest', 'bch_getTokens_V0', 'bch_getBalance_V0', 'bch_getChangeLockingBytecode_V0'])

  // read local storage
  const readUnit = localStorage.getItem("unit");
  const readDarkMode = localStorage.getItem("darkMode");
  if(readUnit && (readUnit=="bch" || readUnit=="sat")) bchUnit.value = readUnit;
  if(readDarkMode == "true"){
    document.body.classList.add("dark");
    darkMode.value = true;
  }

  async function updateTokenList(resultGetFungibleTokens: any, resultGetNFTs: any){
    if(!wallet.value) return // should never happen
    // Option to fetch new tokenlist in advance or not
    if(!resultGetFungibleTokens || !resultGetNFTs){
      const promiseGetFungibleTokens = wallet.value?.getAllTokenBalances();
      const promiseGetNFTs = wallet.value?.getAllNftTokenBalances();
      const balancePromises: any[] = [promiseGetFungibleTokens, promiseGetNFTs];
      [resultGetFungibleTokens, resultGetNFTs] = await Promise.all(balancePromises);
    }
    // Get NFT data
    const arrayTokens:TokenData[] = [];
    for (const tokenId of Object.keys(resultGetFungibleTokens)) {
      arrayTokens.push({ tokenId, amount: resultGetFungibleTokens[tokenId] });
    }
    console.time('Utxo Promises');
    const nftUtxoPromises = [];
    for (const tokenId of Object.keys(resultGetNFTs)) {
      nftUtxoPromises.push(wallet.value.getTokenUtxos(tokenId));
    }
    const nftUtxoResults = await Promise.all(nftUtxoPromises);
    for (const nftUtxos of nftUtxoResults) {
      const tokenId = nftUtxos[0].token?.tokenId;
      if(!tokenId) return // should never happen
      arrayTokens.push({ tokenId, nfts: nftUtxos });
    }
    console.timeEnd('Utxo Promises');
    tokenList.value = arrayTokens;
  }

  return { wallet, balance, maxAmountToSend, network, explorerUrl, tokenList, updateTokenList, plannedTokenId, nrBcmrRegistries, bchUnit, chaingraph, ipfsGateway, darkMode, autoApprove }
})