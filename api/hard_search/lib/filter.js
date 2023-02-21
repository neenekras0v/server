const personalList = require('./load/personalList');
const workList = require('./load/workList');
const orderList = require('./load/orderList');
const vacancyList = require('./load/vacancyList');

const redisClient = require('./connector/redis');

const {
  formatCityFromPersonalName,
  formatName,
  formatPassport,
  formatDateBirth,
  formatDate,
  formatDateDiff,
  formatPhone,
  formatGender,
  formatCity,
  formatTypeTimeWork,
} = require('./formatter');

const _ = require('lodash');
const moment = require('moment-timezone');

async function filter() {
  let stopList = [];

  let keys = await redisClient.sendCommand(['keys', 'stopList:*']);

  await _.forEach(keys, async (key) => {
    let value = await redisClient.get(key);
    stopList.push(value);
  });

  let dateStart = moment()
    .tz('Asia/Yekaterinburg')
    .add(-1, 'day')
    .format('YYYY-MM-DD');

  let dateEnd = moment()
    .tz('Asia/Yekaterinburg')
    .add(3, 'day')
    .format('YYYY-MM-DD');

  const WorkList = await workList(dateStart, dateEnd);
  const PersonalList = await personalList();
  const VacancyList = await vacancyList();
  const OrderList = await orderList([dateStart, dateEnd]);

  function vacancy(key) {
    try {
      let vacancy = _.find(VacancyList, function (item) {
        return item.id === key;
      });

      return vacancy.name;
    } catch {
      return 'Комплектовщик';
    }
  }

  let filterList = [];

  let list = await _.forEach(PersonalList, async (person) => {
    let stop = false;

    let user = {
      id: person.Id,
      crm_name: person.Name,
      address: person.Address,
      name: formatName(person.Name),
      city: formatCityFromPersonalName(person.Name, person.Address),
      access: true,
      gender: formatGender(vacancy(person.Pid), person.Name),
      vacancy: vacancy(person.Pid),
      phone: formatPhone(person.Phone),
      old: {
        date: formatDate(person.DateBirth),
        diff: formatDateBirth(person.DateBirth),
      },
      create: {
        date: formatDate(person.CreatePers),
        diff: formatDateDiff(person.CreatePers, 'days'),
      },
      passport: formatPassport(person.Pasport),
      comment: person.Document,
      work: [],
      free: [],
    };

    if (person.PeriodWork === 6) {
      user.access = false;
      user.phone = '*******';
      user.comment = 'Черный список';
    }

    await _.forEach(WorkList, async (work) => {
      if (Number(person.Id) === Number(work.Id)) {
        let item = {
          id: work.WorkListId,
          status: 'busy',
          typeTimeWork: formatTypeTimeWork(work.After, work.Before),
          date: formatDate(work.Date),
          timeStart: work.After,
          timeEnd: work.Before,
          city: formatCity(work.Address),
          gender: user.gender,
          address: work.Address,
          vacancy: vacancy(work.PostModelId).name,
          comment: work.Notes,
          count: work.Count,
          countOrder: { need: 0, real: 0 },
        };

        user.work.push(item);
      }
    });

    await _.forEach(OrderList, async (order) => {
      let stopOrder = false;

      let yesterday = moment()
        .tz('Asia/Yekaterinburg')
        .add(-1, 'day')
        .format('DD.MM.YYYY');

      let todayHour = moment().tz('Asia/Yekaterinburg').format('HH');
      let today = moment().tz('Asia/Yekaterinburg').format('DD.MM.YYYY');

      _.forEach(user.work, async (busy) => {
        let busyPlusDayDate = moment(busy.date, 'DD.MM.YYYY')
          .tz('Asia/Yekaterinburg')
          .add(1, 'day')
          .format('DD.MM.YYYY');
        if (
          busyPlusDayDate === order.date &&
          busy.typeTimeWork === 'Ночь' &&
          order.typeTimeWork === 'День'
        ) {
          stopOrder = true;
        }
      });

      if (order.city === user.city && yesterday != order.date) {
        if (user.gender === 'МУЖ') {
          if (!stopOrder) {
            user.work.push(order);
          }
        } else if (user.gender === 'ЖЕН') {
          if (order.gender === 'ЖЕН') {
            if (!stopOrder) {
              user.work.push(order);
            }
          }
        }
      }
    });

    let dateFree = [];
    let dateBusy = [];

    await _.forEach(user.work, async (item) => {
      if (item.status === 'free') {
        dateFree.push(item.date);
      } else if (item.status === 'busy') {
        dateBusy.push(item.date);
      }
    });

    dateFree = _.uniq(dateFree);
    dateBusy = _.uniq(dateBusy);

    await _.forEach(dateFree, async (fItem) => {
      await _.forEach(dateBusy, async (bItem) => {
        if (fItem === bItem) {
          _.remove(dateFree, function (n) {
            return n == fItem;
          });
        }
      });
    });

    dateFree.map((n) => {
      user.free.push(n);
    });

    if (!user.phone) {
      stop = true;
    }

    if (user.comment?.match(/@ignore/gi)) {
      stop = true;
    }

    if (dateFree?.length <= 0) {
      stop = true;
    }

    stopList.map((item) => {
      if (Number(user.id) === Number(item)) {
        stop = true;
      }
    });

    if (!stop) {
      filterList.push(user);
    }
  });

  await Promise.all(list).then(async () => {});

  return filterList;
}

async function resultFilter() {
  try {
    let result = await filter();

    result = await _.orderBy(
      result,
      (i) => moment(i.create.date, 'DD.MM.YYYY').format('YYYY-MM-DD'),
      'desc'
    );

    let free = await _.orderBy(
      result.free,
      (i) => moment(i, 'DD.MM.YYYY').format('YYYY-MM-DD'),
      'asc'
    );

    let work = await _.orderBy(
      result.work,
      (i) => moment(i.date, 'DD.MM.YYYY').format('YYYY-MM-DD'),
      'asc'
    );

    result.work = await work;
    result.free = await free;

    return { count: result?.length, user: result[0] };
  } catch (error) {
    return [];
  }
}

module.exports = resultFilter;
