const https = require('https');

const fetchJson = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: null });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
};

async function testPiped() {
  const instances = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.tokhmi.xyz",
    "https://pipedapi.smnz.de",
    "https://api.piped.projectsegfau.lt",
    "https://pipedapi.lunar.icu",
    "https://pipedapi.r4fo.com"
  ];
  const videoId = "Y4baVj4ohac";
  
  for (const instance of instances) {
    try {
      const { status, data } = await fetchJson(`${instance}/streams/${videoId}`);
      if (status === 200 && data?.audioStreams?.length > 0) {
        console.log(`✅ Success Piped: ${instance}`);
      } else {
        console.log(`❌ Failed Piped: ${instance} (Status: ${status})`);
      }
    } catch (e) {
      console.log(`❌ Failed Piped: ${instance} (${e.message})`);
    }
  }
}

async function testCobalt() {
  const instances = [
    "https://api.cobalt.tools/api/json",
    "https://co.wuk.sh/api/json",
    "https://cobalt.qwy2.dev/api/json",
    "https://cobalt.knot.app/api/json"
  ];
  
  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Origin': 'https://cobalt.tools',
      'Referer': 'https://cobalt.tools/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    body: JSON.stringify({
      url: "https://www.youtube.com/watch?v=Y4baVj4ohac",
      isAudioOnly: true,
      aFormat: "mp3"
    })
  };
  
  for (const instance of instances) {
    try {
      const { status, data } = await fetchJson(instance, options);
      if (status === 200 && data?.status) {
        console.log(`✅ Success Cobalt: ${instance} -> ${data.status}`);
      } else {
        console.log(`❌ Failed Cobalt: ${instance} (Status: ${status}, Error: ${data?.error?.code || 'unknown'})`);
      }
    } catch (e) {
      console.log(`❌ Failed Cobalt: ${instance} (${e.message})`);
    }
  }
}

async function run() {
  await testPiped();
  await testCobalt();
}
run();
