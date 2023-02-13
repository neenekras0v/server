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
} = require('./formatter');

const _ = require('lodash');
const moment = require('moment-timezone');

async function filter() {
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
    let vacancy = _.find(VacancyList, function (item) {
      return item.id === key;
    });

    return vacancy;
  }

  let stopList = [];

  for await (const key of redisClient.scanIterator({
    TYPE: 'string',
    MATCH: 'stopList' + '*',
    COUNT: 1000,
  })) {
    let value = await redisClient.get(key);
    stopList.push(value);
  }

  let filterList = [];

  let list = await _.forEach(PersonalList, async (person) => {
    let stop = false;

    let user = {
      id: person.Id,
      name: formatName(person.Name),
      city: formatCityFromPersonalName(person.Name, person.Address),
      access: true,
      gender: formatGender(vacancy(person.Pid).name, person.Name),
      vacancy: vacancy(person.Pid).name,
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
      let yesterday = moment()
        .tz('Asia/Yekaterinburg')
        .add(-1, 'day')
        .format('DD.MM.YYYY');

      if (order.city === user.city && yesterday != order.date) {
        if (user.gender === 'МУЖ') {
          user.work.push(order);
        } else if (user.gender === 'ЖЕН') {
          if (order.gender === 'ЖЕН') {
            user.work.push(order);
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
}

module.exports = resultFilter;
