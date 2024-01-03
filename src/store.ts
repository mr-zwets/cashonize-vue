import { defineStore } from "pinia"
import { ref, computed } from 'vue'
import { Wallet, TestNetWallet, BaseWallet, Config } from "mainnet-js"
import { IndexedDBProvider } from "@mainnet-cash/indexeddb-storage"

// set mainnet-js config
Config.EnforceCashTokenReceiptAddresses = true;
// @ts-ignore
BaseWallet.StorageProvider = IndexedDBProvider;

const defaultChaingraph = "https://gql.chaingraph.pat.mn/v1/graphql";
const dafaultIpfsGateway = "https://ipfs.io/ipfs/";

export const useStore = defineStore('store', () => {

  const wallet = ref(null as (Wallet |TestNetWallet | null));
  const bcmrRegistries = ref(undefined as (any[] | undefined));

  const bchUnit = ref("bch" as ("bch" | "sat"));
  const chaingraph = ref(defaultChaingraph);
  const ipfsGateway = ref(dafaultIpfsGateway);

  const network = computed(() => wallet.value?.network == "mainnet" ? "mainnet" : "chipnet")

  return { wallet, bcmrRegistries, bchUnit, chaingraph, ipfsGateway, network }
})