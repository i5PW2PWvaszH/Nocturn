import { ipcRenderer } from 'electron';
import Actions         from '../actions';
import RichState       from './RichState'
import TwitterClient   from './TwitterClient'

export default class IpcAction {
  constructor(document) {
    this.document = document;
  }

  subscribe(store) {
    ipcRenderer.on('invoke-reply', (event) => {
      let state = new RichState(store);
      let tweet = state.activeTweet();
      if (!tweet) return null;

      store.dispatch(Actions.setText(`@${tweet.user.screen_name} `));
      store.dispatch(Actions.setInReplyTo(tweet));

      // FIXME: Use better way to focus
      this.document.getElementById('tweet_editor').focus();
    })

    ipcRenderer.on('select-next-tweet', (event) => {
      let state = new RichState(store);
      let tweet = state.findNextTweet();
      if (!tweet) return null;
      store.dispatch(Actions.selectTweet(tweet, state.activeTab(), state.activeAccount()));

      let visibleLimit = this.document.body.clientHeight;
      let activeBottom = this.document.querySelector('.timeline.active .tweets.active .tweet.active').getBoundingClientRect().bottom;
      if (visibleLimit < activeBottom) {
        let element = this.document.querySelector('.timeline.active .tweets.active');
        element.scrollTop += element.clientHeight / 2;
      }
    });

    ipcRenderer.on('select-prev-tweet', (event) => {
      let state = new RichState(store);
      let tweet = state.findPrevTweet();
      if (!tweet) return null;
      store.dispatch(Actions.selectTweet(tweet, state.activeTab(), state.activeAccount()));

      let activeTop = this.document.querySelector('.timeline.active .tweets.active .tweet.active').getBoundingClientRect().top;
      let visibleLimit = this.document.querySelector('.timeline.active .tweets.active').getBoundingClientRect().top;
      if (activeTop < visibleLimit) {
        let element = this.document.querySelector('.timeline.active .tweets.active');
        element.scrollTop -= element.clientHeight / 2;
      }
    });

    ipcRenderer.on('select-first-tweet', (event) => {
      let state = new RichState(store);
      let tweet = state.findFirstTweet();
      if (!tweet) return null;

      store.dispatch(Actions.selectTweet(tweet, state.activeTab(), state.activeAccount()));
      let element = this.document.querySelector('.timeline.active .tweets.active');
      element.scrollTop = 0;
    });

    ipcRenderer.on('invoke-favorite', (event) => {
      let state  = new RichState(store);
      let client = new TwitterClient(state.activeAccount());
      let active  = state.activeTweet();
      if (!active) return null;

      client.favoriteStatus(active.id_str, (tweet) => {
        store.dispatch(Actions.addTweet(tweet, state.activeAccount(), state.activeTab()));
      });
    });

    ipcRenderer.on('invoke-retweet', (event) => {
      let state  = new RichState(store);
      let client = new TwitterClient(state.activeAccount());
      let active  = state.activeTweet();
      if (!active) return null;

      if (window.confirm(`Are you sure to retweet?: ${active.text}`)) {
        client.retweetStatus(active.id_str, (tweet) => {
          store.dispatch(Actions.addTweet(tweet, state.activeAccount(), state.activeTab()));
        });
      }
    });

    ipcRenderer.on('invoke-delete', (event) => {
      let state  = new RichState(store);
      let client = new TwitterClient(state.activeAccount());
      let active  = state.activeTweet();
      if (!active) return null;

      client.deleteStatus(active.id_str, (tweet) => {
        store.dispatch(Actions.removeTweet(tweet, state.activeAccount(), state.activeTab()));
      });
    });

    ipcRenderer.on('select-next-tab', (event) => {
      let state = new RichState(store);
      let tab   = state.nextTab();
      store.dispatch(Actions.selectTab(tab, state.activeAccount()));
    });

    ipcRenderer.on('select-prev-tab', (event) => {
      let state = new RichState(store);
      let tab   = state.prevTab();
      store.dispatch(Actions.selectTab(tab, state.activeAccount()));
    });

    ipcRenderer.on('select-next-account', (event) => {
      let state = new RichState(store);
      let index = state.nextAccountIndex();
      store.dispatch(Actions.activateAccount(index));
    });

    ipcRenderer.on('select-prev-account', (event) => {
      let state = new RichState(store);
      let index = state.prevAccountIndex();
      store.dispatch(Actions.activateAccount(index));
    });
  }
}