import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5/dist/ethers.esm.js";
import web3State, { chains } from "./services/web3State.js";
import { smartContractABI } from "./data/abi.js";
import { uint16 } from "./utils/utils";
import { adminService } from "./services/adminService";

export const CHAIN_CODES = {
  ETH: "0x1",
  MATIC: "0x89",
  POLYGON: "0x89",
  GO: "0x3C",
};

const METAMASK_STATUS = {
  REJECTED: 4001,
};

export const checkMetamaskForInstallation = () => {
  if (!window.ethereum) {
    throw new Error("WEB3_WALLET_IS_NOT_INSTALLED");
  }
  return true;
};

export async function switchChain(chainId) {
  try {
    const isHex = ethers.utils.isHexString(chainId);
    if (!isHex) chainId = CHAIN_CODES[chainId];
    console.log("ethers: switchChain: ", chainId);

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  } catch (switchError) {
    console.error("Switch chain error", switchError);

    console.log(chains);
    console.log(chains[chainId]);
    try {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [chains[chainId]],
      });
    } catch (addError) {
      console.error("Error adding chain to MetaMask", addError);
    }
  }
}

export const getSmartContractInstance = (contractAddress, signer) => {
  if (!contractAddress) return null;

  const contract = new ethers.Contract(
    contractAddress,
    smartContractABI,
    signer
  );
  return contract;
};

/**
 * nuqtahAdminAddress - NUQTAH operator address
 * @returns if the operator(Nuqtah) is allowed to manage all of the assets of owner.
 */
export const isNuqtahApprovedForAll = async (
  contractAddress,
  network,
  nuqtahAdminAddress
) => {
  checkMetamaskForInstallation();
  await switchChain(network);
  const { signer, from } = await getSignerAndAddress();

  const contract = getSmartContractInstance(contractAddress, signer);
  const isApproved = await contract.isApprovedForAll(from, nuqtahAdminAddress);
  return isApproved;
};

/**
 * nuqtahAdminAddress - NUQTAH operator address
 * @returns if the operator(Nuqtah) is allowed to manage all of the assets of owner.
 */
export const isApprovedForAll = async (
  contractAddress,
  ownerAddress,
  operatorAddress
) => {
  checkMetamaskForInstallation();

  if (!ownerAddress || !contractAddress || !operatorAddress)
    return "Missing required fields: ownerAddress(collection owner address) or contractAddress. Please recreate a collection with your metamask or set value manually for collection.ownerAddress!";
  const { signer } = await getSignerAndAddress();

  const contract = getSmartContractInstance(contractAddress, signer);
  console.log("Contract: ", contract);
  const isApproved = await contract.isApprovedForAll(
    ownerAddress,
    operatorAddress
  );

  console.log("isApproved: ", isApproved);
  return isApproved;
};

export const setNuqtahAsApprover = async (
  operatorAddress,
  contractAddress,
  approved,
  network
) => {
  checkMetamaskForInstallation();
  await switchChain(network);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  // Signer
  const signer = provider.getSigner();
  let from = await signer.getAddress();

  const contract = getSmartContractInstance(contractAddress, signer);
  const gasPrice = await signer.getGasPrice();

  const tx = await contract.setApprovalForAll(operatorAddress, approved, {
    from,
    gasPrice,
  });

  const receipt = await tx.wait();
  console.log("result: ", tx, receipt);
  return tx;
};

const getSignerAndAddress = async () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  // Signer
  const signer = provider.getSigner();
  let from = await signer.getAddress();

  return { signer, from, provider };
};

export const burn = async (network, contractAddress, tokenID) => {
  checkMetamaskForInstallation();
  await switchChain(network);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  // Signer
  const signer = provider.getSigner();
  let from = await signer.getAddress();
  console.log("Your metamask wallet: ", from);

  const gasPrice = await signer.getGasPrice();
  console.log("Ethers: Signer gas price: ", gasPrice);

  // Getting contract
  const contract = getSmartContractInstance(contractAddress, signer);
  console.log("ethers: contract: ", contract);

  const tx = await contract.burn(tokenID, {
    from,
    gasPrice,
    gasLimit: 400000,
  });
  const receipt = await tx.wait();
  console.log("result: ", tx, receipt);
};

// Used for transfering NFT to another account
export const web3MintWithMetamask = async (nft, toAddress, contractAddress) => {
  console.log("web3MintWithMetamask: ", { nft, toAddress, contractAddress });

  await switchChain(nft.network);

  const { signer } = await getSignerAndAddress();
  const contract = getSmartContractInstance(contractAddress, signer);
  const gasPrice = await signer.getGasPrice();

  const tokenId = nft?.tokenID || uint16(new Date().getTime());
  console.log("TokenID", tokenId);

  const tx = await contract.safeMint(toAddress, tokenId, {
    from: toAddress,
    gasPrice,
    gasLimit: 400000,
  });

  const receipt = await tx.wait();

  return { details: tx, receipt, tokenId };
};

export const signMessage = async (message, network) => {
  if (network) {
    await switchChain(network);
  }

  const { signer } = await getSignerAndAddress();
  // const contract = getSmartContractInstance(contractAddress, signer)
  // const signture = await web3.eth.personal.sign(message, address)

  let messageHash = ethers.utils.id(message);
  let messageHashBytes = ethers.utils.arrayify(messageHash);

  const flatSig = await signer.signMessage(messageHashBytes);
  let signture = ethers.utils.splitSignature(flatSig);

  console.log("signMessage: ", { message, signture });

  return {
    message,
    signture,
  };
};

export const sendTransaction = async (toAddress, amountInEther, network) => {
  console.log("sendTransaction: ", {
    toAddress,
    amountInEther,
    network,
  });
  checkMetamaskForInstallation();
  await switchChain(network);
  const { signer, from, provider } = await getSignerAndAddress();
  const gasPrice = await signer.getGasPrice();
  console.log("gasPrice: ", gasPrice);

  const txnOptions = {
    from,
    to: toAddress,
    value: ethers.utils.parseEther(String(amountInEther), "ether"),
    gasPrice,
  };
  console.log("Options: ", txnOptions);
  console.log("RPC");
  const tx = await signer.sendTransaction(txnOptions);
  console.log("Transaction hash: ", tx);

  const receipt = await tx.wait();
  console.log("receipt: ", receipt);
  return { details: tx, receipt };
};

export const web3TransferNFT = async (nft, toAddress, contractAddress) => {
  console.log("web3TransferNFT: ", { nft, toAddress, contractAddress });
  await switchChain(nft.network);

  const { signer, from } = await getSignerAndAddress();
  const contract = getSmartContractInstance(contractAddress, signer);

  const tx = await contract["safeTransferFrom(address,address,uint256)"](
    nft.ownerAddress,
    toAddress,
    nft.tokenID
  );

  console.log("ethers transfer tx: ", tx);

  const receipt = await tx.wait();

  return { details: tx, receipt };
};

export const deployToken = async (
  name,
  symbol,
  baseURI,
  postActionOnFailure,
  network
) => {
  try {
    checkMetamaskForInstallation();
    await switchChain(network);

    let response = await fetch(
      "https://raw.githubusercontent.com/nuqtah/contracts/main/contracts/ERC721v1.bin"
    );
    let content = await response.text();

    const adminAddressR = await adminService.fetchAdminAddress();
    const extraMinter = adminAddressR.address;

    const { signer, from } = await getSignerAndAddress();

    const abi = ethers.utils.defaultAbiCoder;
    let encodedParameters = abi
      .encode(
        ["string", "string", "string", "address"],
        [name, symbol, baseURI, extraMinter]
      )
      .slice(2);

    console.log("encodedParameters: ", encodedParameters);

    const newContract = new ethers.ContractFactory(
      smartContractABI,
      content,
      signer
    );

    console.log("new contract instance: ", newContract);

    const contract = await newContract.deploy(
      name,
      symbol,
      baseURI,
      extraMinter
    );
    const txReceipt = await contract.deployTransaction.wait();

    console.log("txReceipt: ", txReceipt);

    const explorerUrl = chains[CHAIN_CODES[network]].blockExplorerUrls[0];
    const transactionHashOnBlockExplorerURL = `${explorerUrl}/tx/${txReceipt.transactionHash}`;

    return {
      txHash: txReceipt.transactionHash,
      contractAddress: txReceipt.contractAddress,
      blockExplorerURL: transactionHashOnBlockExplorerURL,
      ownerAddress: txReceipt.from,
    };
  } catch (error) {
    /**
     * 4001 - rejected status
     */
    if (error.code === METAMASK_STATUS.REJECTED) {
      typeof postActionOnFailure === "function" && postActionOnFailure();
      throw new Error(error?.message);
    }

    console.log("Error while deploying contract: ", error);
    throw new Error("COLLECTION_IS_NOT_CREATED");
  }
};

export const connectWallet = async (params) => {
  //receive params
  const noMetamaskCallback = params?.noMetamaskCallback;

  if (typeof window.ethereum !== "undefined") {
    const { from } = await getSignerAndAddress();

    if (from) {
      web3State.setAccount(from);
    }
  } else {
    if (noMetamaskCallback) {
      noMetamaskCallback();
    } else {
      alert(
        "No web3 wallet was detected. Please, install MetaMask from https://metamask.io, App Stores, or refresh the page."
      );
    }
  }
};

export const getBalance = async (_address, _network) => {
  _network = normalizeNetwork(_network);

  const rpcUrl = chains[_network]?.rpcUrls
    ? chains[_network]?.rpcUrls[0]
    : "https://mainnet.infura.io/v3/96136349e5e4402eb5cc039210bc6d5e";

  const provider = new ethers.getDefaultProvider(rpcUrl);
  const balanceInWei = await provider.getBalance(_address);

  const balance = ethers.utils.formatEther(balanceInWei);
  return parseFloat(balance).toFixed(3);
};

const normalizeNetwork = (_network) => {
  const isHex = ethers.utils.isHexString(_network);
  if (!isHex) _network = CHAIN_CODES[String(_network).toUpperCase()];
  return _network;
};

const handleChainChanged = (network) => {
  console.log("ethers: network: ", network);
  web3State.setChain(network);
};

const handleAccountChanged = (accounts) => {
  console.log("ethers: accounts: ", accounts[0]);
  const account = accounts[0];
  web3State.setAccount(account);
};

const bootstrap = () => {
  if (window.ethereum) {
    ethereum.on("accountsChanged", handleAccountChanged);
    ethereum.on("chainChanged", handleChainChanged);

    window.ethereum
      .request({ method: "eth_accounts" })
      .then(handleAccountChanged)
      .catch((err) => {
        console.error(err);
      });

    window.ethereum.request({ method: "eth_accounts" });
  }
};

bootstrap();
