const scraperObject = {
    url: 'http://books.toscrape.com',
    url2: 'https://www.strava.com/login',
    url3: 'https://heatmap-external-a.strava.com/auth',
    async scraper(browser){

        let page = await browser.newPage();
//        console.log(`Navigating to ${this.url}...`);
//        await page.goto(this.url);

        const page1 = await browser.newPage()
        await page1.setViewport({width: 1278, height: 1024})
        await page1.goto('https://www.strava.com/login', {waitUntil: 'networkidle2'})
        // await page1.screenshot({path: '01_login_page_loaded.png'});

        import {login,password} from './auth.js'
        // ./auth.js contains:
        // const login = 'YOURSTRAVAUSERNAME'
        // const password = 'YOURSTRAVAPASSWORD'
        // export {login,password}

        await page1.waitForSelector('form')
        await page1.type('input#email', login)
        await page1.type('input#password', password)
        // await page1.screenshot({path: '02_login_and_password_inserted.png'});
        
        await page1.waitFor(200)
        await page1.evaluate(()=>document
          .querySelector('button#login-button')
          .click()
        )
        await page1.waitForNavigation()
        // await page1.screenshot({path: '03_redirected_to_new_page.png'});
        
        // Извлекаем _strava4_session cookie
        const sessionFourCookie = await page1.cookies()
        // console.log(sessionFourCookie)
        // console.log("================================")
        
        // Авторизация на heatmap-external-a.strava.com/auth
        const page2 = await browser.newPage()
        await page2.setCookie(...sessionFourCookie)
        await page2.goto('https://heatmap-external-a.strava.com/auth')
        
        // Извлекаем дополненные CloudFront cookies
        const cloudfontCookie = await page2.cookies()
        // await page2.screenshot({path: '04_redirected_to_heatmap_page.png'});
        // console.log(cloudfontCookie)
        // console.log(cloudfontCookie.filter(e => e.name == 'CloudFront-Signature'))
        // console.log(cloudfontCookie.filter(e => ['CloudFront-Signature',CloudFront-Key-Pair-Id,CloudFront-Policy].includes(e)))

        let stringOfCookies = cloudfontCookie
            .filter(e => e.name.match(/^(CloudFront-Signature|CloudFront-Key-Pair-Id|CloudFront-Policy)$/))
            .map(e => `${e.name}=${e.value}; `)
            .reduce(((s,v)=> s+v),"")
        console.log(stringOfCookies)

        let xml = `
<?xml version="1.0" encoding="UTF-8"?>
<providers>
	<provider id="10902" type="0" visible="true" background="-1">
		<name>Simon Strava</name>
		<mode>Simon Global Heatmap All</mode>
		<countries>World</countries>
		<url><![CDATA[https://heatmap-external-c.strava.com/tiles-auth/all/hot/{z}/{x}/{y}.png?v={ts}]]></url>
		<zoomPart>{z}-8</zoomPart>
		<zoomMin>8</zoomMin>
		<zoomMax>22</zoomMax>
		<tileSize>256</tileSize>
		<attribution>
			<![CDATA[© 2019 Strava]]>
		</attribution>
		<extraHeader>
			<![CDATA[ Cookie#{${stringOfCookies}}]]>
		</extraHeader>
		<extraHeader>
			<![CDATA[ Connection#keep-alive ]]>
		</extraHeader>
		<extraHeader>
			<![CDATA[ Referer#https://www.strava.com/heatmap ]]>
		</extraHeader>
		<extraHeader>
			<![CDATA[ User-Agent#Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36 ]]>
		</extraHeader>
	</provider>
</providers>
`
        console.log(xml)
        
        await browser.close()
    }
}

module.exports = scraperObject;
