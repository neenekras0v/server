const loadMssql = require('../connector/mssql');
const _ = require('lodash');
const moment = require('moment-timezone');

const vacancyList = require('./vacancyList');
const userList = require('./userList');

const { formatDayNumber, formatCity } = require('../formatter');

async function orderList(dateset) {
  try {
    let dates = [dateset[0], dateset[1]];

    let FormatDateDiff = moment(dateset[1]).diff(dateset[0], 'days', true);

    for (let index = 0; index < FormatDateDiff - 1; index++) {
      let date = moment()
        .tz('Asia/Yekaterinburg')
        .add(index, 'day')
        .format('YYYY-MM-DD');
      dates.push(date);
    }

    dates = _.orderBy(dates, (i) => i, 'asc');

    let loadVacancyList = await vacancyList();
    let loadUserList = await userList();

    let dateStart = dates[0];
    let dateEnd = dates[dates.length - 1];

    let dayNumberDateStart = formatDayNumber(dateStart, 'YYYY-MM-DD');
    let dayNumberDateEnd = formatDayNumber(dateEnd, 'YYYY-MM-DD');

    if (dayNumberDateStart > 1) {
      dateStart = moment(dateStart)
        .tz('Asia/Yekaterinburg')
        .add(-dayNumberDateStart + 1, 'day')
        .format('YYYY-MM-DD');
    }

    if (dayNumberDateEnd > 1) {
      dateEnd = moment(dateEnd)
        .tz('Asia/Yekaterinburg')
        .add(-dayNumberDateEnd + 1, 'day')
        .format('YYYY-MM-DD');
    }

    let querySQL = `
      SELECT * FROM dbo.WorkLists WHERE CAST(dbo.WorkLists.Date as datetime) between '${dateStart}' and '${dateEnd}'
        `;

    let list = await loadMssql(querySQL);

    let orderList = [];

    let result = await _.forEach(list, async (item, i) => {
      let orderDate = moment(item.Date)
        .tz('Asia/Yekaterinburg')
        .format('YYYY-MM-DD');

      let client = await _.filter(loadUserList, function (uItem) {
        return uItem.id === item.DIrectorId;
      });

      let vacancy = await _.filter(loadVacancyList, function (vItem) {
        return vItem.id === item.PostModelId;
      });

      function gender() {
        let gender = 'МУЖ';

        if (vacancy[0].name.match(/^Ж-/i)) {
          gender = 'ЖЕН';
        }

        return gender;
      }

      await _.forEach(dates, async (day, i) => {
        let order = {
          id: item.WorkAllListsId,
          status: 'free',
          date: '',
          timeStart: item.After,
          timeEnd: item.Before,
          city: formatCity(item.Address),
          gender: gender(),
          address: item.Address,
          vacancy: vacancy[0].name,
          comment: '',
          client: client[0].name,
          smsText: item.Notes,
          countOrder: {
            need: 0,
            real: 0,
          },
        };

        let date = formatDayNumber(day, 'YYYY-MM-DD');

        let dateStartWeek = moment(day, 'YYYY-MM-DD')
          .add(-date + 1, 'day')
          .format('YYYY-MM-DD');

        if (dateStartWeek === orderDate) {
          order.date = moment(day, 'YYYY-MM-DD').format('DD.MM.YYYY');

          switch (Number(date)) {
            case 1:
              order.comment = item.note1;
              order.countOrder.need = item.One;
              order.countOrder.real = item.count1;
              break;
            case 2:
              order.comment = item.note2;
              order.countOrder.need = item.Two;
              order.countOrder.real = item.count2;
              break;
            case 3:
              order.comment = item.note3;
              order.countOrder.need = item.Three;
              order.countOrder.real = item.count3;
              break;
            case 4:
              order.comment = item.note4;
              order.countOrder.need = item.Four;
              order.countOrder.real = item.count4;
              break;
            case 5:
              order.comment = item.note5;
              order.countOrder.need = item.Five;
              order.countOrder.real = item.count5;
              break;
            case 6:
              order.comment = item.note6;
              order.countOrder.need = item.Six;
              order.countOrder.real = item.count6;
              break;
            case 7:
              order.comment = item.note7;
              order.countOrder.need = item.Seven;
              order.countOrder.real = item.count7;
              break;
            default:
              break;
          }
        }

        orderList.push(order);
      });
    });

    await Promise.all(result).then(async () => {
      orderList = await _.orderBy(orderList, (i) => i.date, 'asc');
      orderList = await _.filter(orderList, function (item) {
        return (
          item.countOrder.need > item.countOrder.real &&
          item.countOrder.need > 0
        );
      });
    });

    return orderList;
  } catch (error) {
    console.log('orderList ' + error);
  }
}

module.exports = orderList;
