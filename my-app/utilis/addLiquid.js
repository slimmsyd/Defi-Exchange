import { Contract, utils } from 'ethers';
import { TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI } from '../constants'


//helps add liquid to the exchange 
//if the user is adding inital liquidity, the user decides the ether and FAM tokesn he wants to add 
//to the exchange, if adding liquid after the inital liquidity added
//then we calculate the fam tokens he can add, given the eth he wants to add by keeping the ratios
//constant

export const addLiquid = async(signer, addFAMAmountWei, addEtherAmountWei) => {
    try { 
        //create a new instance of the token contract 
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            signer
        );
        //create a new instance of exchange contract 
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            signer
        );

        //Because our fam tokesn are ERC20, user would need to give the contract allowance
        //to take the required number of FAM tokens out of his contract
        let tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            addFAMAmountWei.toString()
        );
        await tx.wait();
        //After the contract has the apporval, add the ether and Fam tokens in the liquidity
        tx = await exchangeContract.addLiquid(addFAMAmountWei, {
            value: addEtherAmountWei,
        });
        await tx.wait();
    }catch(err) {
        console.error(err);
    }
}

//Calucates the FAM tokens that need to be added to the liquidity
//given '_addEtherAmountWei' amount of ether

export const calculateFam = async(_addEther = "0", etherBalanceContract, famTokensReserve) => { 
     //_addEther is a string, we need to convert it to a BIGNUMBER before we can do our calculations
     //We do that using the 'parseether' function from 'ether.js'
     const _addEtherAmountWei = utils.parseEther(_addEther);
     //Ratio needs to be maintained when we add liquid
     //We need to let the user know who a specific amount of ether how many "FAM" tokens
     //User can add so that the price impact is not too large
     const famTokensAmount = +addEtherAmountWei.mul(famTokensReserve).div(etherBalanceContract);
     return famTokensAmount; 
}


