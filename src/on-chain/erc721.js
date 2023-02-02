import dotenv from 'dotenv';
dotenv.config();
import ethers from 'ethers';

const PROVIDER_ENDPOINT = process.env.PROVIDER_ENDPOINT;
const CHAIN_ID = +process.env.CHAIN_ID;

function getContract(address) {
    const provider = new ethers.providers.JsonRpcProvider(PROVIDER_ENDPOINT, CHAIN_ID);
    const abi = ["function ownerOf (uint256) view returns (address)"];
    return new ethers.Contract(address, abi, provider);
}

/**
 * @param {{ 
 *  name: string,
 *  address: string,
 *  include: number[]?
 *  startId: number?,
 *  endId: number?, 
 * }} options 
 * @returns {{
 *      type: string,
 *      name: string,
 *      assets: {
 *          id: number, 
 *          owner: string 
 *      }[]
 * }} collection metadata and assets
 */
export async function getErc721Assets(options) {
    const contract = getContract(options.address);
    const assets = [];

    if (options.include) {
        for (const tokenId of options.include) {
            try {
                assets.push(await getErc721Owner(contract, tokenId));
            } catch(err) {
                console.error(`Token ${tokenId} Error:`);
                console.error(err.reason);
                continue;
            }
        }
    } else {
        for (let tokenId = (options.startId ?? 1); tokenId <= (options.endId ?? 500); tokenId++) {
            try {
                assets.push(await getErc721Owner(contract, tokenId));
                
            } catch (err) {
                if (err && err.reason && err.reason.includes('nonexistent token')) {
                    console.log(`auto-detected end of collection at token ${tokenId-1}.`);
                    break;
                } else {
                    console.error(`Token ${tokenId} Error:`);
                    console.error(err.reason);
                    continue;
                }
            }
        }
    }

    return {
        type: 'erc721',
        name: options.name,
        address: options.address,
        assets
    };
}

async function getErc721Owner(contract, tokenId) {
    console.log(`Getting data for ${tokenId}...`);
    return {
        id: tokenId,
        owner: await contract.ownerOf(tokenId),
    }
}
