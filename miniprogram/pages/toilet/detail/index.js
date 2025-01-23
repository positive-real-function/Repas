const { getCollection } = require('../../../config/collections.js');
const db = wx.cloud.database();

Page({
  data: {
    colors: [
      { name: '咖色', value: 'brown' },
      { name: '黄褐色', value: 'yellow' },
      { name: '黑色', value: 'black' },
      { name: '绿色', value: 'green' },
      { name: '红色', value: 'red' },
      { name: '灰白色', value: 'grey' }
    ],
    states: ['正常', '便秘', '拉肚子'],
    shapes: ['香蕉', '颗粒', '软稀糊', '软状条状', '水样便便'],
    selectedColor: '',
    selectedState: '',
    selectedShape: '',
    duration: 0,
    startTime: null,
    openid: '',
    user: ''
  },

  onLoad() {
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('toiletData', (data) => {
      console.log('接收到的数据:', data);
      this.setData({
        duration: data.duration,
        startTime: data.startTime,
        openid: data.openid,
        user: data.user
      });
      console.log('设置后的数据:', this.data);
    });
  },

  selectColor(e) {
    this.setData({
      selectedColor: e.currentTarget.dataset.color
    });
  },

  selectState(e) {
    this.setData({
      selectedState: e.currentTarget.dataset.state
    });
  },

  selectShape(e) {
    this.setData({
      selectedShape: e.currentTarget.dataset.shape
    });
  },

  async submitRecord() {
    if (!this.data.selectedColor || !this.data.selectedState || !this.data.selectedShape) {
      wx.showToast({
        title: '请完整填写记录',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    
    try {
      const createTime = new Date(this.data.startTime);
      const duration = this.data.duration;

      console.log('准备保存的数据:', {
        color: this.data.selectedColor,
        state: this.data.selectedState,
        shape: this.data.selectedShape,
        duration: duration,
        createTime: createTime,
        user: this.data.user
      });

      const result = await db.collection(getCollection('TOILET')).add({
        data: {
          color: this.data.selectedColor,
          state: this.data.selectedState,
          shape: this.data.selectedShape,
          duration: duration,
          createTime: createTime,
          user: this.data.user
        }
      });

      console.log('保存成功，返回结果:', result);

      wx.showToast({
        title: '记录成功',
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        wx.navigateBack({
          delta: 2
        });
      }, 1500);
    } catch (err) {
      console.error('保存记录失败，错误详情:', err);
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none',
        duration: 3000
      });
    } finally {
      wx.hideLoading();
    }
  }
}); 