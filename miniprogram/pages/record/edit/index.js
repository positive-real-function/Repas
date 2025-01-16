Page({
  data: {
    imagePath: '',
    user: '',
    avatar: '',
    mealTypes: ['早餐', '午餐', '晚餐', '夜宵'],
    selectedType: '午餐',
    mealName: '',
    price: '',
    currencySymbol: '¥', // 根据用户设置默认货币符号
    recordId: '',
    isEdit: false
  },

  onLoad(options) {
    const { imagePath, user, avatar } = options;
    // 设置默认货币符号
    const currencySymbol = user === 'Nora' ? '¥' : '€';
    
    this.setData({
      imagePath,
      user,
      avatar,
      currencySymbol,
      recordId: options.id || '',
      isEdit: options.isEdit === 'true'
    });
    
    if (this.data.isEdit) {
      this.loadRecordDetail();
    }
  },

  // 加载记录详情
  async loadRecordDetail() {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      const db = wx.cloud.database();
      const res = await db.collection('records').doc(this.data.recordId).get();
      const record = res.data;

      this.setData({
        title: record.title,
        content: record.content,
        images: record.images || [],
        // 设置其他字段...
      });
    } catch (err) {
      console.error('加载记录失败：', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 选择餐点类型
  onTypeChange(e) {
    this.setData({
      selectedType: this.data.mealTypes[e.detail.value]
    });
  },

  // 输入餐点名称
  onNameInput(e) {
    this.setData({
      mealName: e.detail.value
    });
  },

  // 输入价格
  onPriceInput(e) {
    this.setData({
      price: e.detail.value
    });
  },

  // 保存记录
  async saveRecord() {
    if (!this.data.mealName.trim()) {
      wx.showToast({
        title: '请输入餐点名称',
        icon: 'none'
      });
      return;
    }

    if (!this.data.price.trim()) {
      wx.showToast({
        title: '请输入价格',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    const recordData = {
      title: this.data.title,
      content: this.data.content,
      images: this.data.images,
      // 其他字段...
    };

    try {
      const db = wx.cloud.database();
      if (this.data.isEdit) {
        // 更新已有记录
        await db.collection('records').doc(this.data.recordId).update({
          data: recordData
        });
      } else {
        // 添加新记录
        recordData.createTime = db.serverDate();
        await db.collection('records').add({
          data: recordData
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
      console.error('保存记录失败：', err);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
}); 