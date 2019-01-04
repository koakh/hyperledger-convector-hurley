import { SysWrapper } from './utils/sysWrapper';
import { join } from 'path';
import { Analytics } from './utils/analytics';
import * as Insight from 'insight';
import { ConfigTxYamlGenerator } from './generators/configtx.yaml';
import { CryptoConfigYamlGenerator } from './generators/cryptoconfig.yaml';
import { CryptoGeneratorShGenerator } from './generators/cryptofilesgenerator.sh';

export class CLI {
    static async createNetwork(name: string, organizations?: string, users?: string, channels?: string) {
        const cli = new NetworkCLI();
        console.log(`organizations ${organizations}`);
        await cli.init(name, Number.parseInt(organizations), Number.parseInt(users),
            Number.parseInt(channels));
        return cli;
    }
    static async cleanNetwork() {
        const cli = new NetworkCLI();
        await cli.clean();
        return cli;
    }

    static async installChaincode(chaincode: string, path: string) {
        const cli = new ChaincodeCLI(chaincode);
        await cli.installChaincode(chaincode, path);
        return cli;
    }
    static async upgradeChaincode(chaincode: string, path: string) {
        const cli = new ChaincodeCLI(chaincode);
        await cli.upgradeChaincode(chaincode, path);
        return cli;
    }
    static async invokeChaincode(chaincode: string, fn: string) {
        const cli = new ChaincodeCLI(chaincode);
        await cli.invokeChaincode(chaincode, fn);
        return cli;
    }
}

export class NetworkCLI {
    networkRootPath = './hyperledger-fabric-network';
    analytics: Analytics;
    constructor() {
        this.analytics = new Analytics();
    }

    public async init(name: string, organizations?: number, users?: number, channels?: number) {
        // SysWrapper.execFile(join(__dirname, '../scripts/restart.sh'), {
        //     path: join(__dirname,'../')
        // });

        let orgs = [];
        for (let i = 0; i < organizations; i++) {
            orgs.push(`org${i}`);
        }
        let chs = [];
        for (let i = 0; i < channels; i++) {
            chs.push(`ch${i}`);
        }

        const homedir = require('os').homedir();
        let config = new ConfigTxYamlGenerator('configtx.yaml', join(homedir, this.networkRootPath), {
            orgs,
            channels: 1
        });
        let cryptoConfig = new CryptoConfigYamlGenerator('crypto-config.yaml', join(homedir, this.networkRootPath), {
            orgs,
            users
        });
        let cryptoGenerator = new CryptoGeneratorShGenerator('generator.sh', join(homedir, this.networkRootPath), {
            orgs,
            networkRootPath: join(homedir, this.networkRootPath),
            channels: chs
        });

        await config.save();
        await cryptoConfig.save();
        await cryptoGenerator.run();
        await cryptoGenerator.check();

        this.analytics.trackNetworkNew(`NETWORK=${name}`);
    }
    public async clean() {
        SysWrapper.execFile(join(__dirname, '../scripts/clean.sh'), {
            path: join(__dirname, '../')
        });
        this.analytics.trackNetworkClean();
    }
}
export class ChaincodeCLI {
    analytics: Analytics;
    constructor(private name: string) {
        this.analytics = new Analytics();
    }
    public async installChaincode(chaincode: string, path: string) {
        // let model = new ModelModel(this.chaincode, this.name, true);
        // await model.save();
        this.analytics.trackChaincodeInstall(`CHAINCODE=${chaincode}`);
    }
    public async upgradeChaincode(chaincode: string, path: string) {
        // let model = new ModelModel(this.chaincode, this.name, true);
        // await model.save();
        this.analytics.trackChaincodeUpgrade(`CHAINCODE=${chaincode}`);
    }
    public async invokeChaincode(chaincode: string, fn: string) {
        // let model = new ModelModel(this.chaincode, this.name, true);
        // await model.save();
        this.analytics.trackChaincodeInvoke(`CHAINCODE=${this.installChaincode} fn=${fn}`);
    }
}