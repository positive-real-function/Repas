// pages/message/index.js
const db = wx.cloud.database()
const messagesCollection = db.collection('messages')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    messages: [], // 留言列表
    reachBottom: false, // 是否到底
    page: 1,
    pageSize: 10,
    currentTab: 'all', // 当前选中的分类
    showMenu: false,
    tabList: {
      all: '全部',
      mine: '我的',
      lover: 'Ta的',
      apology: '悄悄话'
    },
    showSearch: false,
    searchKey: '',
    searchResult: [],
    showApologyMenu: false,  // 用于底部悄悄话菜单
    userInfo: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // 获取用户身份信息
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getOpenId'
      });
      
      let userInfo;
      if (result.openid === 'oup1z5Dv4pTjk0iZKjg3BT63EH7g') {
        userInfo = {
          openId: result.openid,
          avatar: '/images/headphoto/Elie.jpeg',
          userName: 'Elie'
        };
      } else {
        userInfo = {
          openId: result.openid,
          avatar: '/images/headphoto/Nora.jpeg',
          userName: 'Nora'
        };
      }
      
      this.setData({ userInfo });
    } catch (err) {
      console.error('获取用户信息失败：', err);
    }

    this.loadMessages();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.setData({ page: 1, reachBottom: false });
    this.getMessageList();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (!this.data.reachBottom) {
      this.setData({
        page: this.data.page + 1
      }, () => {
        this.getMessageList();
      });
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 获取留言列表
  async getMessageList() {
    wx.showLoading({ title: '加载中' });
    try {
      // 构建查询条件
      let query = {};
      
      switch (this.data.currentTab) {
        case 'all':
          // 全部页面：显示所有非悄悄话留言
          query.type = { $ne: 'apology' };  // 不等于悄悄话类型
          break;
          
        case 'mine':
          // 我的页面：显示当前用户的留言
          if (this.data.userInfo) {
            query.userName = this.data.userInfo.userName;
          }
          query.type = { $ne: 'apology' };  // 排除悄悄话
          break;
          
        case 'lover':
          // Ta的页面：显示另一个人的留言
          if (this.data.userInfo) {
            // 如果是Elie就显示Nora的，如果是Nora就显示Elie的
            query.userName = this.data.userInfo.userName === 'Elie' ? 'Nora' : 'Elie';
          }
          query.type = { $ne: 'apology' };  // 排除悄悄话
          break;
          
        case 'apology':
          // 悄悄话页面：只显示悄悄话
          query.type = 'apology';
          break;
      }

      // 获取数据
      const res = await messagesCollection
        .where(query)
        .orderBy('createTime', 'desc')
        .skip((this.data.page - 1) * this.data.pageSize)
        .limit(this.data.pageSize)
        .get();

      // 格式化时间
      const messages = res.data.map(msg => ({
        ...msg,
        time: this.formatTime(msg.createTime)
      }));

      this.setData({
        messages: this.data.page === 1 ? messages : [...this.data.messages, ...messages],
        reachBottom: messages.length < this.data.pageSize
      });
    } catch (err) {
      console.error('获取留言失败：', err);
      wx.showToast({
        title: '获取留言失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 格式化时间
  formatTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;

    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return Math.floor(diff / minute) + '分钟前';
    } else if (diff < day) {
      return Math.floor(diff / hour) + '小时前';
    } else {
      return Math.floor(diff / day) + '天前';
    }
  },

  // 写留言
  onWriteMessage(e) {
    if (!this.data.showApologyMenu) {  // 只有在悄悄话菜单未显示时才跳转
      wx.navigateTo({
        url: '/pages/message/write/index'
      });
    }
  },

  // 进入道歉助手
  onGoToApologyHelper(e) {
    console.log('点击悄悄话按钮');
    // 移除事件处理相关代码，直接跳转
    wx.navigateTo({
      url: '/pages/message/apology/index',
      success: () => {
        console.log('跳转成功');
        this.setData({
          showApologyMenu: false
        });
      },
      fail: (err) => {
        console.error('跳转失败：', err);
      }
    });
  },

  // 显示菜单
  showTabMenu() {
    this.setData({
      showMenu: true
    });
  },

  // 关闭菜单
  closeMenu() {
    this.setData({
      showMenu: false
    });
  },

  // 底部加号长按菜单相关方法
  onLongPress() {
    console.log('长按加号按钮');
    this.setData({
      showApologyMenu: true
    });
  },

  onTouchEnd() {
    this.setData({
      isLongPress: false
    });
  },

  // 修改切换分类方法
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.currentTab) {
      this.closeMenu();
      return;
    }
    
    this.setData({
      currentTab: tab,
      messages: [],
      page: 1,
      reachBottom: false,
      showMenu: false
    });
    
    this.getMessageList();
  },

  // 显示搜索框
  onSearch() {
    this.setData({
      showSearch: true,
      originalMessages: this.data.messages
    })
  },

  // 关闭搜索框
  closeSearch() {
    if (this.data.originalMessages) {
      this.setData({
        showSearch: false,
        searchKey: '',
        messages: this.data.originalMessages,
        originalMessages: null
      })
    } else {
      this.setData({
        showSearch: false,
        searchKey: '',
        messages: [],
        page: 1,
        reachBottom: false
      }, () => {
        this.getMessageList()
      })
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKey: e.detail.value
    }, () => {
      // 输入后自动搜索
      this.doSearch();
    });
  },

  // 执行搜索
  async doSearch() {
    const key = this.data.searchKey.trim();
    
    // 如果搜索关键词为空，恢复原始列表
    if (!key) {
      if (this.data.originalMessages) {
        this.setData({
          messages: this.data.originalMessages
        });
      }
      return;
    }

    wx.showLoading({ title: '搜索中' });
    try {
      const res = await messagesCollection
        .where({
          content: db.RegExp({
            regexp: key,
            options: 'i'
          })
        })
        .orderBy('createTime', 'desc')
        .get();

      const messages = res.data.map(msg => ({
        ...msg,
        time: this.formatTime(msg.createTime)
      }));

      this.setData({ messages });
    } catch (err) {
      console.error('搜索失败：', err);
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 添加加载消息的方法
  loadMessages() {
    this.setData({
      page: 1,
      reachBottom: false
    }, () => {
      this.getMessageList();
    });
  },

  // 处理页面点击事件
  onPageTap() {
    if (this.data.showMenu) {
      this.closeMenu();
    }
    if (this.data.showApologyMenu) {
      this.setData({
        showApologyMenu: false
      });
    }
  },

  // 长按卡片处理
  onLongPressCard(e) {
    console.log('长按卡片', e.currentTarget.dataset);
    const messageId = e.currentTarget.dataset.id;
    const userName = e.currentTarget.dataset.user;
    
    // 判断是否是自己的留言
    if (this.data.userInfo && userName === this.data.userInfo.userName) {
      console.log('可以删除', {
        currentUser: this.data.userInfo.userName,
        messageUser: userName
      });
      wx.showModal({
        title: '提示',
        content: '确定要删除这条留言吗？',
        success: async (res) => {
          if (res.confirm) {
            wx.showLoading({ title: '删除中' });
            try {
              // 从云数据库删除
              await messagesCollection.doc(messageId).remove();
              
              // 从本地数据中移除
              const messages = this.data.messages.filter(msg => msg._id !== messageId);
              this.setData({ messages });
              
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            } catch (err) {
              console.error('删除失败：', err);
              if (err.errCode === -1) {
                wx.showToast({
                  title: '没有权限删除',
                  icon: 'none'
                });
              } else {
                wx.showToast({
                  title: '删除失败',
                  icon: 'none'
                });
              }
            } finally {
              wx.hideLoading();
            }
          }
        }
      });
    } else {
      wx.showToast({
        title: '只能删除自己的留言',
        icon: 'none'
      });
      console.log('不能删除', {
        currentUser: this.data.userInfo?.userName,
        messageUser: userName
      });
    }
  }
})