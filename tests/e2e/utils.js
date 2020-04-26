import fetch from 'node-fetch';
import config from './config';

const env = process.env.API_ENV || 'dev';
let API = config[env].url;

if (process.env.API_PATH_OVERRIDE) {
  API = process.env.API_PATH_OVERRIDE;
}

const geturl = async path => {
  const url = `${API}${path}`;

  console.log(`Feteching ${url}`);

  const data = await fetch(url);
  const status = await data.status;
  const json = await data.json();

  return { json, status };
};

export default geturl;
