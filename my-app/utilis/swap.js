import { Contract, utils } from 'ethers';
import { TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI } from '../constants';


//returns teh number of ETH/FAM tokens taht can be retrived
//when the user swaps "_swapAmountWEI" amount of ETH/FAM tokens.
export const getAmountOfTokensFromSwap = async(
    _swapAmountWei,
    provider,
    ethBalance,
    ethSelected,
    reserveFAM
) => { 
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        provider
    );
    let amountOfTokens;
    //IF eth selected this means our input value is "ETH" which means our input value is ..
    //_swapAmountWEI, the input reserve would be "ethBalance" of the contract and output reserve
    //would be "Fam" reserve
    if(ethSelected) { 
        amountOfTokens = await exchangeContract.getAmountOfTokens(
            _swapAmountWei,
            ethBalance,
            reserveFAM
        );
    }else { 
        //IF ETH not selected this means our input value is "fam" tokens which means our nput amount etch..
        amountOfTokens = await exchangeContract.getAmountOfTokens(
            _swapAmountWei,
            reserveFAM,
            ethBalance
        );
    }

    return amountOfTokens;
}

//swaps "swapAmountWei" of eth/fam tokesn with tokenstoberecieved amount of ...
export const swapTokens = async(
    signer,
    swapAmountWei,
    tokensToBeRecieved,
    ethSelected
) => {
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer,
    );
    const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
    );
    let tx;
    //if eth selected call the "ethToFamToken" function 
    if(ethSelected) { 
        tx = await exchangeContract.ethToFamilyDevToken(
            tokensToBeRecieved, {value: swapAmountWei}
        )
    }else { 
        //User has approve "swapAmountWei" for the contract because of "fam" is a ERC20
        tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            swapAmountWei.toString()
        );
        await tx.wait();
        //call famDevTokenToEth which would take in "swapAmountWei" of fam tokens and would send back tokensToBeRecieved
        tx = await exchangeContract.familyDevTokenToEth(
            swapAmountWei,
            tokensToBeRecieved
        );

    };
    await tx.wait();
        

}