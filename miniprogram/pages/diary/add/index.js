// pages/diary/edit/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: '',
    weather: '',
    mood: '😊',
    location: '',
    images: [],
    currentDate: '',
    diaryId: '',
    isEdit: false,
    showMoodPicker: false,
    showWeatherPicker: false,
    moods: ['😊', '😄', '😢', '😡', '😴', '🤔'],
    weathers: ['☀️', '🌤', '☁️', '🌧', '🌩', '❄️', '🌈', '⚡️', '🌪', '🌫'],
    openid: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const isEdit = options.isEdit === 'true';
    this.setData({
      weather: options.weather || '☀️',
      openid: options.openid,
      currentDate: this.formatDate(new Date()),
      diaryId: options.id || '',
      isEdit: isEdit
    });

    if (isEdit) {
      this.loadDiaryDetail();
    }
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

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 格式化日期
  formatDate(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}月${day}日`;
  },

  // 输入内容
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 9 - this.data.images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        wx.showLoading({
          title: '上传中...'
        });
        
        // 上传图片到云存储
        const uploadTasks = res.tempFilePaths.map(path => {
          return wx.cloud.uploadFile({
            cloudPath: `diary_images/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`,
            filePath: path
          });
        });
        
        Promise.all(uploadTasks)
          .then(results => {
            const newImages = results.map(res => res.fileID);
            this.setData({
              images: this.data.images.concat(newImages)
            });
          })
          .catch(err => {
            console.error('上传图片失败：', err);
            wx.showToast({
              title: '上传图片失败',
              icon: 'none'
            });
          })
          .finally(() => {
            wx.hideLoading();
          });
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: this.data.images
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    images.splice(index, 1);
    this.setData({ images });
  },

  // 显示心情选择器
  showMoodPicker() {
    this.setData({
      showMoodPicker: true
    });
  },

  // 隐藏心情选择器
  hideMoodPicker() {
    this.setData({
      showMoodPicker: false
    });
  },

  // 阻止冒泡
  stopPropagation() {},

  // 选择心情
  selectMood(e) {
    const mood = e.currentTarget.dataset.mood;
    this.setData({
      mood,
      showMoodPicker: false
    });
  },

  // 获取位置
  // getLocation() {
  //   wx.getLocation({
  //     type: 'gcj02',
  //     success: (res) => {
  //       const { latitude, longitude } = res;
  //       this.setData({
  //         location: `${latitude}, ${longitude}`
  //       });
  //     },
  //     fail: () => {
  //       wx.showToast({
  //         title: '获取位置失败',
  //         icon: 'none'
  //       });
  //     }
  //   });
  // },

  // 加载日记详情
  async loadDiaryDetail() {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      const db = wx.cloud.database();
      const res = await db.collection('diaries').doc(this.data.diaryId).get();
      const diary = res.data;

      this.setData({
        content: diary.content,
        weather: diary.weather,
        mood: diary.mood,
        location: diary.location,
        images: diary.images || []
      });
    } catch (err) {
      console.error('加载日记失败：', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 修改保存日记函数
  async saveDiary() {
    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '保存中...'
    });

    try {
      const db = wx.cloud.database();
      const diaryData = {
        content: this.data.content,
        weather: this.data.weather,
        mood: this.data.mood,
        location: this.data.location,
        images: this.data.images,
      };

      if (this.data.isEdit) {
        // 更新已有日记
        await db.collection('diaries').doc(this.data.diaryId).update({
          data: diaryData
        });
      } else {
        // 添加新日记
        diaryData.createTime = db.serverDate();
        diaryData.openid = this.data.openid;
        await db.collection('diaries').add({
          data: diaryData
        });
      }

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('保存日记失败：', err);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 显示天气选择器
  showWeatherPicker() {
    this.setData({
      showWeatherPicker: true
    });
  },

  // 隐藏天气选择器
  hideWeatherPicker() {
    this.setData({
      showWeatherPicker: false
    });
  },

  // 选择天气
  selectWeather(e) {
    const weather = e.currentTarget.dataset.weather;
    this.setData({
      weather,
      showWeatherPicker: false
    });
  }
})