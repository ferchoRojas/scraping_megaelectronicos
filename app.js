const puppeteer = require("puppeteer");
var fs = require("fs");

async function scrap() {
	try {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();

		const result = [];
		// Queremos saber cuántos resultados hay
        await page.goto(
            `https://www.megaeletronicos.com/py/b/celulares_c-1101_s-110101/1`
        , {timeout: 0});

        await page.waitForSelector(".codigo");

		// Obtenemos cantidad de items 
        const items = await page.evaluate(() => {
            return document.querySelector('.cabecera h4').textContent.match(/(\d+)/)
        })

		// Como hay 12 items por página, dividimos items/12
        const qty = Math.ceil(parseInt(items[0]) / 12)

		// Recorremos todas las páginas
		for (let i = 1; i <= qty; i++) {
			console.log(i,'of',qty)
			await page.goto(
				`https://www.megaeletronicos.com/py/b/celulares_c-1101_s-110101/${i}`
			, {timeout: 0});

			await page.waitForSelector(".codigo");

			const links = await page.evaluate(() => {
				const elements = document.querySelectorAll("a.nav");
				const data = [];
				for (let element of elements) {
					data.push(element.href);
				}
				return data;
			});

			for (const link of links) {
				await page.goto(link, {timeout: 0});
				await page.waitForSelector("h2");
				const title = await page.evaluate(() => {
					return document.querySelector("h2").textContent;
				});
				const price = await page.evaluate(() => {
					return document.querySelector("h2 > span").textContent;
				});
				const images = await page.evaluate(() => {
					const images = [];
					document
						.querySelectorAll(".swiper-slide >.img-fluid")
						.forEach((element) => {
							if (!images.includes(element.getAttribute("src"))) {
								images.push(element.getAttribute("src"));
							}
						});
					return images;
				});
				const featuresNames = await page.evaluate(() => {
					const features = [];
					document
						.querySelectorAll(".especificaciones > .item > .esp")
						.forEach((element) => {
							features.push(element.textContent);
						});
					return features;
				});
				const featuresValues = await page.evaluate(() => {
					const features = [];
					document
						.querySelectorAll(".especificaciones > .item > .valor")
						.forEach((element) => {
							features.push(element.textContent);
						});
					return features;
				});

                const stock = await page.evaluate(() => {
                    return document.querySelector('.rd.stock') ? document.querySelector('.rd.stock').textContent : "Fuera de stock"
                })

                const id = await page.evaluate(() => {
                    const codigo = document.querySelector('.rd.codigo').textContent 
                    return codigo.split(":")[1].trim()
                })

				const pre_result = {
                    Codigo: id,
					Titulo: title,
					Precio: price,
                    Stock: stock,
					Imagenes: images
				};

				// Agregamos todas las especificaciones a pre_result
				for (let i = 0; i < featuresNames.length; i++) {
					pre_result[featuresNames[i]] = featuresValues[i];
				}

				result.push(pre_result);
			}
		}

		// Cerramos el navegador
		browser.close();

		// Escribimos el resultado en un objeto json
		fs.writeFile("./object.json", JSON.stringify(result), (err) => {
			if (err) {
				console.error(err);
				return;
			}
			console.log("File has been created");
		});
	} catch (error) {
		console.log(error);
	}
}

scrap();
