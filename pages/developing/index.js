Page({
  data: {
    pageName: ''
  },
  onLoad(options) {
    if (options.name) {
      wx.setNavigationBarTitle({
        title: options.name
      });
      this.setData({
        pageName: options.name
      });
    }
  }
}); 