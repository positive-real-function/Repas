Page({
  data: {
    imagePath: '',
    user: '',
    avatar: '',
    mealTypes: ['早餐', '午餐', '晚餐', '夜宵'],
    selectedType: '午餐',
    mealName: '',
    price: '',
    currencySymbol: '¥',
    recordId: '',
    isEdit: false
  },

  onLoad(options) {
    const { imagePath, user, avatar } = options;
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

  async loadRecordDetail() {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      const db = wx.cloud.database();
      const res = await db.collection('meal_records').doc(this.data.recordId).get();
      const record = res.data;

      // 从价格字符串中提取数字部分
      const priceNumber = record.price.replace(/[^0-9]/g, '');

      this.setData({
        selectedType: record.type,
        mealName: record.name,
        price: priceNumber,
        currencySymbol: record.price.startsWith('¥') ? '¥' : '€',
        imagePath: record.image
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

  onTypeChange(e) {
    this.setData({
      selectedType: this.data.mealTypes[e.detail.value]
    });
  },

  onNameInput(e) {
    this.setData({
      mealName: e.detail.value
    });
  },

  onPriceInput(e) {
    this.setData({
      price: e.detail.value
    });
  },

  async saveRecord() {
    // 表单验证
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

    try {
      const db = wx.cloud.database({
        env: 'repas-0gr1x5by6fb1c499'
      });
      
      const recordData = {
        name: this.data.mealName.trim(),
        type: this.data.selectedType,
        price: `${this.data.currencySymbol}${this.data.price}`,
        user: this.data.user,
        avatar: this.data.avatar,
        image: this.data.imagePath
      };

      let result;
      if (this.data.isEdit) {
        result = await db.collection('meal_records').doc(this.data.recordId).update({
          data: recordData
        });
      } else {
        recordData.createTime = db.serverDate();
        result = await db.collection('meal_records').add({
          data: recordData
        });
      }

      console.log('保存结果：', result);

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (err) {
      console.error('保存记录失败：', err);
      console.log('保存的数据：', {
        mealType: this.data.selectedType,
        mealName: this.data.mealName,
        price: this.data.price,
        user: this.data.user,
        recordId: this.data.recordId
      });
      
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
    }
  }
}); 