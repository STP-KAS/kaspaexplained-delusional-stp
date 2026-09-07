import {execFileSync} from 'node:child_process';
// Isolated, pinned development dependencies; nothing is bundled into the public site.
execFileSync('npm',['install','--prefix','.cache/wrap-evm','--no-audit','--no-fund','--save-exact','ethers@6.17.0','ganache@7.9.2','solc@0.8.36'],{stdio:'inherit'});
