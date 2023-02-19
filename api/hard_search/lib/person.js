const _ = require('lodash');
const moment = require('moment-timezone');

const personProfile = require('./load/personProfile');
const vacancyList = require('./load/vacancyList');
const workList = require('./load/workList');
const orderList = require('./load/orderList');

const {
  formatCityFromPersonalName,
  formatName,
  formatPassport,
  formatDateBirth,
  formatDate,
  formatDateDiff,
  formatTypeTimeWork,
  formatPhone,
  formatGender,
  formatCity,
} = require('./formatter');

async function person(id, dateStart, dateEnd) {
  try {
    let PersonProfile = await personProfile(id);
    let VacancyList = await vacancyList();

    if (!dateStart) {
      dateStart = moment()
        .tz('Asia/Yekaterinburg')
        .add(-1, 'day')
        .format('YYYY-MM-DD');
    }

    if (!dateEnd) {
      dateEnd = moment()
        .tz('Asia/Yekaterinburg')
        .add(2, 'day')
        .format('YYYY-MM-DD');
    }

    let dateset = [dateStart, dateEnd];

    dateset = _.orderBy(dateset, (i) => i, 'asc');

    PersonProfile = PersonProfile[0];

    if (!PersonProfile) {
      return [];
    }

    function vacancy(key) {
      let vacancy = _.find(VacancyList, function (item) {
        return item.id === key;
      });

      return vacancy;
    }

    let person = {
      id: id,
      crm_name: PersonProfile.Name,
      address: PersonProfile.Address,
      name: formatName(PersonProfile.Name),
      city: formatCityFromPersonalName(
        PersonProfile.Name,
        PersonProfile.Address
      ),
      access: true,
      gender: formatGender(vacancy(PersonProfile.Pid).name, PersonProfile.Name),
      vacancy: vacancy(PersonProfile.Pid).name,
      phone: formatPhone(PersonProfile.Phone),
      old: {
        date: formatDate(PersonProfile.DateBirth),
        diff: formatDateBirth(PersonProfile.DateBirth),
      },
      create: {
        date: formatDate(PersonProfile.CreatePers),
        diff: formatDateDiff(PersonProfile.CreatePers, 'days'),
      },
      passport: formatPassport(PersonProfile.Pasport),
      comment: PersonProfile.Document,
      work: [],
      free: [],
    };

    if (PersonProfile.PeriodWork === 6) {
      person.access = false;
      person.phone = '*******';
      person.comment = 'Черный список';
      return person;
    }

    let WorkList = await workList(dateset[0], dateset[1], person.id);

    if (WorkList) {
      await _.forEach(WorkList, async (work) => {
        if (Number(work.Id) === Number(person.id)) {
          let item = {
            id: work.WorkListId,
            status: 'busy',
            date: formatDate(work.Date),
            typeTimeWork: formatTypeTimeWork(work.After, work.Before),
            timeStart: work.After,
            timeEnd: work.Before,
            city: formatCity(work.Address),
            gender: person.gender,
            address: work.Address,
            vacancy: vacancy(work.PostModelId).name,
            comment: work.Notes,
            count: work.Count,
            countOrder: { need: 0, real: 0 },
          };
          person.work.push(item);
        }
      });
    }

    let OrderListDateset = [dateset[0], dateset[1]];
    let OrderListDatesetDiff = moment(dateset[1]).diff(
      dateset[0],
      'days',
      true
    );

    if (OrderListDatesetDiff > 7) {
      let OrderListDatesetStart = moment()
        .tz('Asia/Yekaterinburg')
        .add(-1, 'day')
        .format('YYYY-MM-DD');

      OrderListDatesetEnd = moment()
        .tz('Asia/Yekaterinburg')
        .add(7, 'day')
        .format('YYYY-MM-DD');

      OrderListDateset = [OrderListDatesetStart, OrderListDatesetEnd];
    }

    let OrderList = await orderList(OrderListDateset);

    await _.forEach(OrderList, async (order) => {
      let stopOrder = false;

      let yesterday = moment()
        .tz('Asia/Yekaterinburg')
        .add(-1, 'day')
        .format('DD.MM.YYYY');

      let todayHour = moment().tz('Asia/Yekaterinburg').format('HH');
      let today = moment().tz('Asia/Yekaterinburg').format('DD.MM.YYYY');

      if (order.date === today && Number(todayHour) >= Number(order.timeEnd)) {
        stopOrder = true;
      }
      // _.forEach(person.work, async (busy) => {
      //   let busyPlusDayDate = moment(busy.date, 'DD.MM.YYYY')
      //     .tz('Asia/Yekaterinburg')
      //     .add(1, 'day')
      //     .format('DD.MM.YYYY');
      //   if (
      //     busyPlusDayDate === order.date &&
      //     busy.typeTimeWork === 'Ночь' &&
      //     order.typeTimeWork === 'День'
      //   ) {
      //     stopOrder = true;
      //   }
      // });

      if (order.city === person.city && yesterday != order.date) {
        if (person.gender === 'МУЖ') {
          if (!stopOrder) {
            person.work.push(order);
          }
        } else if (person.gender === 'ЖЕН') {
          if (order.gender === 'ЖЕН') {
            if (!stopOrder) {
              person.work.push(order);
            }
          }
        }
      }
    });

    let dateFree = [];
    let dateBusy = [];

    await _.forEach(person.work, async (item) => {
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
      person.free.push(n);
    });

    return person;
  } catch (error) {
    console.log('person ' + error);
    return person;
  }
}

async function resultPerson(id, dateStart, dateEnd) {
  let result = await person(id, dateStart, dateEnd);

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

  return result;
}

module.exports = { person, resultPerson };
