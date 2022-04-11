import {getBalance, Contract}from 'ethers';
import { TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI } from '../constants'


export const getEtherBalance = async (
  provider,
  address,
  contract = false
) => {
  try {
    // If the caller has set the `contract` boolean to true, retrieve the balance of
    // ether in the `exchange contract`, if it is set to false, retrieve the balance
    // of the user's address
    if (contract) {
      const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
      return balance;
    } else {
      const balance = await provider.getBalance(address);
      return balance;
    }
  } catch (err) {
    console.error(err);
    return 0;
  }
};

  export const getFAMILYTokensBalance = async(provider, address) => { 
      try { 
          const tokenContract = new Contract(
              TOKEN_CONTRACT_ADDRESS,
              TOKEN_CONTRACT_ABI,
              provider,
          );
          const balanceOfFamTokens = await tokenContract.balanceOf(address);;
          return balanceOfFamTokens;
      }catch(err) {
          console.error(err);
      }
  };

  //get the LP tokens in the account
  //provided by the address 

  export const getLPTokensBalance = async(provider, address) => { 
      try { 
          const exchangeContract = new Contract( 
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
          );
          const balanceOfLpTokens = await exchangeContract.balanceOf(address);
          return balanceOfLpTokens;
      }catch(err) { 
          console.error(err)
      }
  };


  //Gets amount of FAM tokens in the exchange contract address;
  export const getReserveOfFamTokens = async(provider) => { 
      try {
          const exchangeContract = new Contract(
              EXCHANGE_CONTRACT_ADDRESS,
              EXCHANGE_CONTRACT_ABI,
              provider
          );
          const reserve = await exchangeContract.getReserve();
          return reserve;
      }catch(err) { 
          console.error(err)
      }
  }




