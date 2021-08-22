App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  //    Initlize over app
  init: function () {
    return App.initWeb3();   // intitalize web3
  },

  //       its connects over client side application to our local blockchain
  initWeb3: async function () {
    if ((typeof window.ethereum !== 'undefined')
      || (typeof window.web3 !== 'undefined')) {
      App.web3Provider = window.ethereum;
      web3 = new Web3(window.ethereum || window.web3.currentProvider)
    } else {
      // here you could use a different provider, maybe use an infura account, or maybe let the user know that they need to install metamask in order to continue
      App.web3Provider = new Web3(new Web3.providers.HttpProvider("HTTP://127.0.0.1:7545"))
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
    // if (typeof window.ethereum !== 'undefined') {
    //   // If a web3 instance is already provided by meta mask
    //   App.web3Provider = window.web3.currentProvider;
    //   web3 = new Web3(window.web3.currentProvider);
    // } else {
    //   //  Specify default instance if no web3 instance provided
    //   App.web3Provider = new Web3.providers.HttpProvider('HTTP://127.0.0.1:7545');
    //   web3 = new Web3(App.web3Provider);
    // }

    // it initialize the contact
  },


  //     THIS FUNCTION LOADS OUR CONTRACT IN OUR FRONTENED APPLICATION
  initContract: function () {
    $.getJSON("Election.json", function (election) {
      App.contracts.Election = TruffleContract(election);
      App.contracts.Election.setProvider(App.web3Provider);
      return App.render();

    })
  },


  render: function () {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
    loader.show();
    content.hide();

    //  Load Account Data
    //      IT IS THE ACCCOUNT THAT WE CONNECTED TO THE BLOCKCHAIN
    web3.eth.getCoinbase(function (err, account) {  // its give the account that we currently connected to the blcks
      if (err == null) {
        App.account = account;
        $('#accountAddress').html('Your Account: ' + account);
      }
    });
    //  Load Contract Data
    App.contracts.Election.deployed().then(function (instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function (candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();
      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();
      
      for (var i = 0; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function (candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          //      Render Candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          //      Render Candidate ballot Option
          var candidateOption = "<option value '"+id+"'>"+name+"</option>";
          candidatesSelect.append(candidateOption)
        });
      }

        return electionInstance.voters(App.account);
    }).then(function(hasVoted){
      if(hasVoted){
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function (error) {
      console.log(error);
    })
  },
  
  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      console.log("App.account ",App.account)
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

//       It Intialize The App whenever window loads
$(function () {
  $(window).load(function () {
    App.init();
  });
});
