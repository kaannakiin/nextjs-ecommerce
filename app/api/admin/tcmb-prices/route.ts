import { Currency } from "@/app/generated/prisma";
import { checkRolesForActions } from "@/lib/checkRoles";
import { XMLParser } from "fast-xml-parser";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const isAuth = await checkRolesForActions("admin_owner");
    if (!isAuth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const response = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml");

    if (!response.ok) {
      throw new Error(`TCMB API returned status: ${response.status}`);
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const json = parser.parse(xml);

    const tarihDate = json.Tarih_Date;
    const currencies = tarihDate.Currency || [];

    const isSupportedTCMBCurrency = (code: string): code is Currency => {
      return (
        Object.values(Currency).includes(code as Currency) &&
        code !== Currency.TRY
      );
    };

    const filteredRates = currencies
      .filter((currency: any) => {
        const banknoteSelling = parseFloat(currency.BanknoteSelling);
        const currencyCode = currency["@_CurrencyCode"];

        return (
          !isNaN(banknoteSelling) &&
          banknoteSelling > 0 &&
          isSupportedTCMBCurrency(currencyCode)
        );
      })
      .map((currency: any) => ({
        currency1: currency["@_CurrencyCode"] as Currency,
        price: parseFloat(currency.BanknoteSelling),
      }));

    const result = {
      date: tarihDate["@_Date"],
      bultenNo: tarihDate["@_Bulten_No"],
      exchangeRates: filteredRates,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching TCMB prices:", error);
    return NextResponse.json(
      {
        message: "TCMB kurları alınırken hata oluştu",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
