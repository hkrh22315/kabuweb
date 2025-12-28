import pandas as pd
import pykakasi

kks = pykakasi.kakasi()

file_path = 'data_j.xls'

try:
    df = pd.read_excel(file_path)

    stocks = []
    for index, row in df.iterrows():
        code = str(row['コード'])
        name = str(row['銘柄名'])

        full_code = f"{code}.T"

        result = kks.convert(name)

        kana = "".join([item['hira'] for item in result])
        romaji = "".join([item['hepburn'] for item in result])

        stocks.append(f' {{ code: "{full_code}", name: "{name}", kana: "{kana}", romaji: "{romaji}"}}')
    
    with open('stockData.js', 'w', encoding='utf-8') as f:
        f.write("// JPX公式データより生成\n")
        f.write("export const ALL_STOCKS = [\n")
        f.write(",\n".join(stocks))
        f.write("\n];\n")

except Exception as e:
    print(e)
