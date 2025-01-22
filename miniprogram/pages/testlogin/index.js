Page({
  data: {
    username: '',
    password: ''
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  },

  handleLogin() {
    const { username, password } = this.data;
    // 简单的测试账号验证
    if ((username === 'test' && password === '123456')) {
      // 登录成功，将用户信息存储到本地
      wx.setStorageSync('userInfo', { openid: username });
      wx.switchTab({
        url: '/pages/home/home'
      });
    } else {
      wx.showToast({
        title: '账号或密码错误',
        icon: 'none'
      });
    }
  }
}); 