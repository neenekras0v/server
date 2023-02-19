const moment = require('moment-timezone');
const petrovich = require('petrovich');

function formatCity(text) {
  let city = 'нет данных';

  try {
    if (text.match(/МСК/gi) || text.match(/Москва/gi)) {
      city = 'Москва';
      if (text.match(/Тверь/gi)) {
        city = 'Тверь';
      }
    } else if (text.match(/ЕКБ/g) || text.match(/Екатеринбург/gi)) {
      city = 'Екатеринбург';
    } else if (text.match(/ПРМ/g) || text.match(/Пермь/gi)) {
      city = 'Пермь';
    } else if (text.match(/Тверь/gi)) {
      city = 'Тверь';
    } else {
      city = 'Пермь';
    }
    return city;
  } catch (error) {
    console.log('formatCity ' + error);
    return 'Пермь';
  }
}

function formatDayNumber(date, format) {
  let result = moment(date, format).format('d');

  return Number(result);
}

function formatPassport(text) {
  try {
    if (text === null || !text) {
      text = 'нет данных';
    }

    return text;
  } catch (error) {
    console.log('formatPassport ' + error);
    return 'нет данных';
  }
}

function formatDateBirth(date) {
  try {
    let dateformat = moment(date).format('YYYY-MM-DD');
    let years = moment().diff(dateformat, 'years', true);

    if (years < 16) {
      return 'нет данных';
    }
    return years.toFixed(0);
  } catch (error) {
    console.log('formatDateBirth ' + error);
    return 'нет данных';
  }
}

function formatDateDiff(date, format) {
  try {
    let dateformat = moment(date).format('YYYY-MM-DD');
    let result = moment().diff(dateformat, format, true);
    return result.toFixed(0);
  } catch (error) {
    console.log('formatDateDiff ' + error);
    return 'нет данных';
  }
}

function formatDate(date) {
  let dateformat = moment(date).format('DD.MM.YYYY');
  return dateformat;
}

function formatCityFromPersonalName(name, address) {
  let city = '';

  if (name.match(/МСК/gi)) {
    city = 'Москва';
    if (name.match(/Тверь/gi)) {
      city = 'Тверь';
    }
  } else if (name.match(/ЕКБ/g)) {
    city = 'Екатеринбург';
  } else if (name.match(/ПРМ/g)) {
    city = 'Пермь';
  } else if (name.match(/Тверь/gi)) {
    city = 'Тверь';
  } else {
    city = '';
  }

  if (city?.length <= 0) {
    if (address?.length > 3) {
      if (address.match(/МСК/gi) || address.match(/Моск/gi)) {
        city = 'Москва';
        if (address.match(/Тверь/gi)) {
          city = 'Тверь';
        }
      } else if (address.match(/ЕКБ/g) || address.match(/Екатеринбург/gi)) {
        city = 'Екатеринбург';
      } else if (address.match(/ПРМ/g) || address.match(/Пермь/gi)) {
        city = 'Пермь';
      } else if (address.match(/Тверь/gi)) {
        city = 'Тверь';
      }
    }
  }

  return city;
}

function formatName(text) {
  try {
    let toArray = text.split('/');
    let name;
    toArray.forEach((element, i) => {
      if (element.match(/[А-я|A-z]{2,}\s[А-я|A-z]{2,}/)) {
        name = element;
      }
    });

    name = name?.replace(/^\s/, '').replace(/\s$/, '');

    return name;
  } catch (error) {
    console.log('formatName' + error);
    return text;
  }
}

function formatGender(vacancy, name) {
  try {
    let gender = 'МУЖ';

    name = formatName(name);

    let toArray = name?.split(/\s/);

    if (toArray?.length > 1) {
      let gen = petrovich.detect_gender(toArray[toArray?.length - 1]);
      if (gen === 'female') {
        gender = 'ЖЕН';
      }
    }

    if (vacancy.match(/^Ж-/i)) {
      gender = 'ЖЕН';
    }

    return gender;
  } catch (error) {
    console.log('formatGender' + error);
    return 'МУЖ';
  }
}

function formatPhone(phone) {
  try {
    if (phone?.length < 11) {
      return false;
    }

    if (phone?.[0] === '-') {
      phone = '8' + phone?.substring(1);
    }

    return phone;
  } catch (error) {
    console.log('formatPhone ' + error);
    return false;
  }
}

function formatTypeTimeWork(start, end) {
  let type = '';

  if (Number(start) <= Number(end)) {
    type = 'День';
  } else if (Number(start) >= Number(end)) {
    type = 'Ночь';
  } else if (Number(start) === Number(end)) {
    type = 'Сутки';
  }

  return type;
}

module.exports = {
  formatCity,
  formatTypeTimeWork,
  formatDayNumber,
  formatCityFromPersonalName,
  formatName,
  formatDateBirth,
  formatPassport,
  formatDate,
  formatDateDiff,
  formatPhone,
  formatGender,
};
