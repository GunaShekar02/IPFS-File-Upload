import React, { Component } from "react";
import Web3 from "web3";

import Meme from "../abis/Meme.json";

const ipfsClient = require("ipfs-http-client");
const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: "5001",
  protocol: "https"
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      buffer: null,
      contract: null,
      memeHash: "QmThAMAcHGP5tN62bCrLT6cT242VZZWtPZeqqq9CnNwQ9V",
      account: ""
    };
  }

  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });
    const networkId = await web3.eth.net.getId();
    const networkData = Meme.networks[networkId];
    if (networkData) {
      const abi = Meme.abi;
      const address = networkData.address;
      const contract = new web3.eth.Contract(abi, address);
      this.setState({ contract });
      const memeHash = await contract.methods.get().call();
      this.setState({ memeHash });
    } else {
      window.alert("Smart contract not deployed to detected network");
    }
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    }
    if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert("please use metamask");
    }
  }

  captureFile = event => {
    event.preventDefault();
    console.log("file cap");
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) });
      console.log("buffer", this.state.buffer);
    };
  };
  //"QmThAMAcHGP5tN62bCrLT6cT242VZZWtPZeqqq9CnNwQ9V"
  //https://ipfs.infura.io/ipfs/QmThAMAcHGP5tN62bCrLT6cT242VZZWtPZeqqq9CnNwQ9V
  onSubmit = event => {
    event.preventDefault();
    console.log("submitting form");
    ipfs.add(this.state.buffer, async (error, result) => {
      console.log("ipfs result", result);
      const memeHash = result[0].hash;
      if (error) {
        console.log("error ipfs", error);
        return;
      }
      try {
        const receipt = await this.state.contract.methods
          .set(memeHash)
          .send({ from: this.state.account });
        console.log("receipt", receipt);
        this.setState({ memeHash });
      } catch (err) {
        console.log(err);
      }
    });
  };

  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://www.dappuniversity.com/bootcamp"
            target="_blank"
            rel="noopener noreferrer"
          >
            IPFS Photo Upload
          </a>
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={`https://ipfs.infura.io/ipfs/${this.state.memeHash}`}
                    height="300"
                    width="300"
                  />
                </a>
                <p>&nbsp;</p>
                <h2>Change Photo</h2>
                <form onSubmit={this.onSubmit}>
                  <input type="file" onChange={this.captureFile} />
                  <input type="submit" />
                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
