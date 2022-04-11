import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI } from '../constants'
import Web3 from 'web3';
import {ethers, utils, Contract,providers, BigNumber} from 'ethers';
import Web3modal from 'web3modal';
import {useRef, useState, useEffect} from 'react';
import { getEtherBalance,getFAMILYTokensBalance,getLPTokensBalance,getReserveOfFamTokens } from '../utilis/getAmount';
import { removeLiquid,getTokensAfterRemove, } from '../utilis/removeLiquid';
import { swapTokens, getAmountOfTokensFromSwap} from '../utilis/swap';
import { addLiquid,calculateFam } from '../utilis/addLiquid';

export default function Home() {
  const web3modalref = useRef();
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  //If it set to true this means the user is on "liquidity" tab else he is on "swap tab"
  const [liquidTab, setLiquidTab] =useState(true);
  const zero = BigNumber.from(0);
  //keeps track of ethBalance in usr account 
  const [ethBalance, setEthBalance] = useState(zero);
  const [reserveFamTokens, setReserveFamTokens] = useState(zero);
  //Keeps track of the ether balance in contract 
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
  //keeps track of FamTokens held by user account 
  const [famBalance, setFamBalance] = useState(zero);
  //lpBalance keeps track of amount of LP tokens held by user account
  const [lpBalance, setLPbalance] = useState(zero);
  //amount of ether that the user wants to add to pool
  const [addEther, setAddEther] = useState(zero);
  //amount of fam tokens wants to add to the pool
  //in case when there is no intial liquid and after liquid gets added it keeps track of the tokens that the user can add given a certain amount of ether
  const [addFamTokens,setAddFamTokens] = useState(zero);
  //amount of ether that would be setn back to the user based on a certain number of LP tokens
  const [removeEther,setRemoveEther] = useState(zero);
  //removes the fam token that would be cent back to the user
  const [removeFam,setRemoveFam] = useState(zero);
  //amount of LP tokens that the user wants to remoe from liquidity
  const [remoeLPTokens, setRemoveLPTokens] = useState("0");
  //amount the user wants to swap
  const [swapAmount, setSwapAmount] = useState("");
  //this keeps track of the number of tokens that the user would recieve after a swap completes
  const [tokensToBeRecievedAfterSwap, setTokensToBeRecievedAfterSwap] = useState(zero);
  //keeps track on whether "eth" or "fam" token is selected. If "eth" is slected wants to swap some eth for ...
  const [ethSelected, setEthSelected] = useState(true);

  //Getting the Fam Tokens
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  //amount of Tokens user wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero)
  
  //get balance of fam tokens
  // const getBalanceOfFamTokens = async() => { 
  //   try { 
  //     const provider = await getProviderOrSigner();
  //     const tokenContract = new Contract(
  //       TOKEN_CONTRACT_ADDRESS,
  //       TOKEN_CONTRACT_ABI,
  //       provider
  //     );
  //       //signer to extract address of currently connect metamask account
  //       const signer = await getProviderOrSigner(true);
  //       //get the addres
  //       const address = signer.getAddress();
  //       //call balanceOf from the token contract to get number of tokens held by user
  //       const balance = await tokenContract.balanceOf(address);
  //       setFamBalance(balance);


  //   }catch(err) { 
  //     console.error(err)
  //   }
  // }

  //get some tokens to trade
  const mintFamTokens = async(amount) => { 
    try { 
      const signer = await getProviderOrSigner(true);
      const tokenContract  = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      //Each token value is 0.001 the value we need to end is 0.001 * amount
      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString())
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You mined some fam tokens")
      await getBalanceOfFamTokens();

    }catch(err) {
      console.error(err)
    }
  }

  const getAmount = async() => { 
    try { 
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      //get amount of eth in user account
      const _ethBalance = await getEtherBalance(provider, address);
      //get amount of "fam" tokens 
      const _famBalance = await getFAMILYTokensBalance(provider ,address);
      //get lp bal
      const _lpBalance = await getLPTokensBalance(provider, address);
      const _reserve = await getReserveOfFamTokens(provider);
      const _ethBalanceContract = await getEtherBalance(provider,null,true);
      setEthBalance(_ethBalance);
      setFamBalance(_famBalance);
      setLPbalance(_lpBalance)
      setReserveFamTokens(_reserve);
      setEtherBalanceContract(_ethBalanceContract);
    }catch(err) { 
      console.error(err);
    }
  };
  const _getAmountOfTokensRecievedFromSwap = async(_swapAmount) => { 
    try { 
      //convert the amount entered by user to a BigNumber
      const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
      if(!_swapAmountWEI.eq(zero)) { 
        const provider = await getProviderOrSigner();
        const _ethBalance = await getEtherBalance(provider,null,true);
        const amountOfTokens = await getAmountOfTokensFromSwap(
          _swapAmountWEI,
          provider,
          ethSelected,
          _ethBalance,
          reserveFamTokens
        );
        setTokensToBeRecievedAfterSwap(amountOfTokens);
      }else { 
        setTokensToBeRecievedAfterSwap(zero)
      }
    }catch(err) { 
      console.error(err)
    }
  };

  //swap functions 
  const swapTokens = async() => { 
    try { 
      const swapAmountWei = utils.parseEther(swapAmount);
      //check if user enters zero
      //we are here using 'eq' method from BigNumer class in 'ether.js'
      if(!swapAmountWei.eq(zero)) { 
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        //call the swapTokensFunctino from 'utils" folder
        await swapTokens(
          signer,
          swapAmountWei,
          tokensToBeRecievedAfterSwap,
          ethSelected
        );
        setLoading(false);
        //get all the updated info
        await getAmount();
        setSwapAmount("")
      }
    }catch(err) { 
      console.error(err);
      setLoading(false);
      setSwapAmount("")
    }
  };

  //add liquid functions
  const _addLiquid = async() => { 
    try { 
      //conver the ether amount enteted buy user to BigNumber
      const addEtherWei = utils.parseEther(addEther.toString());
      //check if the values are zero
      if(!addFamTokens.eq(zero) && !addEtherWei.eq(zero))  {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        //call the liquidity function from the utilis folder
        await addLiquid(signer, addFamTokens,addEtherWei);
        setLoading(false);
        setAddFamTokens(zero);
        //getAmount for all values after the liquid has been added
        await getAmount();
      }else { 
        setAddFamTokens(zero);
      }
    }catch(err) { 
      console.error(err);
      setLoading(false);
      setAddFamTokens(zero);
    }
  }

  //remove liquid 
  const _removeLiquid = async() => {
    try { 
      const provider = await getProviderOrSigner();
      //convert LP tokens entered by user to a BigNumber
      const removeLpTokenWei = utils.parseEther(_removeLPTokens);
      //get eth balance within the exchange contract
      const _ethBalance = await getEtherBalance(provider,null,true);
      //get the fam tokens reserve
      const famTokenReserve = await getReserveOfFamTokens(provider);
      ///call getTokensafter remove from utilis folder
      const {_removeEther, _removeFam} = await getTokensAfterRemove(
        provider,
        removeLpTokenWei,
        _ethBalance,
        famTokenReserve
      );
      setRemoveEther(_removeEther);
      setRemoveFam(_removeFam)
    }catch(err) { 
      console.error(err)
    }
  };

  const _getTokensAfterRemove = async(_removeLPTokens) =>  {
    try  { 
      const provider = await getProviderOrSigner();
      //convert the LP tokens entered by  the user to a Big Number
      const removeLpTokenWei = utils.parseEther(_removeLPTokens);
      //Get the Eth reserve within the exchange contract
      const _ethBalance = await getEtherBalance(provider, null,true);
      //get the fam tokens  reserves from contract 
      const familyDevTokenReserve = await getReserveOfFamTokens(provider);
      //call the getTokensAfterRemove from the utilis  folder
      const {_removeEther, _removeFam} = await getTokensAfterRemove(
        provider,
        removeLpTokenWei,
        _ethBalance,
        familyDevTokenReserve

      );
      setRemoveEther(_removeEther);
      setRemoveFam(_removeFam);
    }catch(err) { 
      console.error(err)
    }

  }


  const getProviderOrSigner = async(needSigner = false) => { 
    const provider = await web3modalref.current.connect(); 
    const web3provider = new providers.Web3Provider(provider);
  
    const {chainId} = await web3provider.getNetwork();
    if(chainId !==4 ) { 
      window.alert("Please connect to rinkeby network"); 
  
    }
  
    if(needSigner) { 
      const signer = web3provider.getSigner();
      return signer;
    }
  
    return web3provider;
  
  };

  const Connect = async() => { 
    try { 
      await getProviderOrSigner();
      setWalletConnected(true);
    }catch(err) { 
      console.error(err)
    }
  }

  useEffect(() => { 
    if(!walletConnected) { 
      web3modalref.current = new Web3modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
  
      Connect();
      getAmount();
    }
  
  },[walletConnected]);


  //Retrives the ether balance of the User Or the Contract
 const renderButton = () => { 
  
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (liquidTab) {
      return (
        <div>
          <div>
            You have:
            <br />
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {utils.formatEther(famBalance)} Crypto Dev Tokens
            <br />
            {utils.formatEther(ethBalance)} Ether
            <br />
            {utils.formatEther(lpBalance)} Crypto Dev LP tokens
          </div>
          <div>
            {/* If reserved CD is zero, render the state for liquidity zero where we ask the user
            who much initial liquidity he wants to add else just render the state where liquidity is not zero and
            we calculate based on the `Eth` amount specified by the user how much `CD` tokens can be added */}
            {utils.parseEther(reserveFamTokens.toString()).eq(zero) ? (
              <div>
                <input class = "input"
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={(e) => setAddEther(e.target.value || "0")}
                  className={styles.input}
                />
                <input
                class ="input"
                  type="number"
                  placeholder="Amount of Fam tokens"
                  onChange={(e) =>
                    setAddFamTokens(
                      BigNumber.from(utils.parseEther(e.target.value || "0"))
                    )
                  }
                  className={styles.input}
                />
                <button class = "btn" onClick={_addLiquid}>
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input class= "input"
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    // calculate the number of CD tokens that
                    // can be added given  `e.target.value` amount of Eth
                    const _addCDTokens = await calculateFam(
                      e.target.value || "0",
                      etherBalanceContract,
                      reserveFamTokens
                    );
                    setAddFamTokens(addFamTokens);
                  }}
                  className={styles.input}
                />
                <div className={styles.inputDiv}>
                  {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                  {`You will need ${utils.formatEther(addFamTokens)} Fam 
                  Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquid}>
                  Add
                </button>
              </div>
            )}
            <div>
              <input class = "input"
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  // Calculate the amount of Ether and CD tokens that the user would recieve
                  // After he removes `e.target.value` amount of `LP` tokens
                  await getTokensAfterRemove(e.target.value || "0");
                }}
                className={styles.input}
              />
              <div className={styles.inputDiv}>
                {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                {`You will get ${utils.formatEther(removeFam)} Fam Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquid}>
                Remove
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <input class = "input "
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              // Calculate the amount of tokens user would recieve after the swap
              await getAmountOfTokensFromSwap(e.target.value || "0");
            }}
            className={styles.input}
            value={swapAmount}
          />
          <select class = "text-black"
            className={styles.select}
            name="dropdown"
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
              // Initialize the values back to zero
              await getAmountOfTokensFromSwap(0);
              setSwapAmount("");
            }}
          >
            <option value="eth">Ethereum</option>
            <option value="fam tokens">Fam Token</option>
          </select>
          <br />
          <div >
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {ethSelected
              ? `You will get ${utils.formatEther(
                  tokensToBeRecievedAfterSwap
                )} Fam Tokens`
              : `You will get ${utils.formatEther(
                  tokensToBeRecievedAfterSwap
                )} Eth`}
          </div>
          <button class = "btn" onClick={swapTokens}>
            Swap
          </button>
        </div>
      );
    }
  };
 const renderMint = () => { 
   return ( 
    <div class = "p-10">
    <div>
      <input
        class = "input"
        type = "number"
        placeholder='Amount Of Tokens'
        onChange={e => setTokenAmount(BigNumber.from(e.target.value))}
      >
      </input>
    </div>
    <button onClick = {()=> mintFamTokens(tokenAmount)} disabled = {!(tokenAmount > 0)} class = "btn">
       Mint Tokens
    </button>
  </div>
   )
  

 }

  return (
    <div >
      <Head>
          <title>Crypto Exchange</title>
          <meta name="description" content="Generated by create next app" />
        <link rel="icon" />
    </Head>
      <body class ="font-body bg-white min-h-screen ">
       <main class = "text-white justify-center flex flex-col align-middle text-center">
            
        <div class = "p-10 bg-white ">
            <h1 class = "text-3xl font-body font-semibold text-secondary  ">Minimal Crypto Exchange !</h1>
        </div>

        <div class = "text-secondary  px-10 ">
          <h2 class = "text-xl font-sans ">Exchange Ethereum To FamilyDev Tokens</h2>
         
        </div>
        <div class = "text-secondary  px-10  ">

            <button onClick = {() => setLiquidTab(!liquidTab)} class = "btn">
              Liquidity
            </button>
            <button onClick = {() => setLiquidTab(false)} class = "btn">
              Swap
            </button>

        </div>
        {renderButton()}
        

        <div class = "text-secondary px-10">
          <h2>You have:</h2>
          <p>This amount of Ether:  {utils.formatEther(ethBalance)} </p>
          <p>This amount of Family Dev Tokens: {utils.formatEther(famBalance)} </p>
          <input></input>
        </div>
        {renderMint()}

       </main>

      

      </body>
    </div>
    
  )
}
