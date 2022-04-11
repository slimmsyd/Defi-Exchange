import { Contract, utils } from 'ethers';
import { TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI } from '../constants';


//removes the "removeLPTokensWei" amount of Lp tokens from
//liquidity and also the calcuated amount of "ether" and "FAM" tokens

export const removeLiquid = async(signer, removeLPTokensWei) => {
    //craete a new instance of exchange contract
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer
    );
    const tx = await exchangeContract.removeLiquid(removeLPTokensWei);
    await tx.wait();
    };


//gets the amount of "ether" and "fam" tokens
//that would be returned back to the user after he removes "removeLPTokensWei" amount
//of LP tokens from the contract

export const getTokensAfterRemove = async(provider, removeLPTokensWei, _ethBalance, famDevReserve) => {
    try { 
        const exchangeContract = new Contract (
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        //get totalSupply of "fam Tokens" LP tokens
        const _totalSupply = await exchangeContract.totalSupply();
        //Here we are using the BIGNUMBER methods of mul and div
        //The amount of ether that would be sent back to the user after he withdraws the LP token
        //id is cal based on ratio
        //(amount of ether that would be sent back/Eth reserves) = (LP tokens withdrawn/Total Supply of LP tokens)
        //we get (amount of ether that would be sent back to user) = (Eth Reserve * LP tokens withdrawn)/(total supply)
        const _removeEther = _ethBalance.mul(removeLPTokensWei).div(_totalSupply);
        const _removeFAM = famDevReserve.mul(removeLPTokensWei).div(_totalSupply);

        return { 
            _removeEther,
            _removeFAM
        }
    }catch(err) { 
        console.error(err)
    };

};


