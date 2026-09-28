package taller.multimedia.backend.service.exchange_rate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import taller.multimedia.backend.dto.exchange_rate.ExchangeRates;

/**
 * El fixture es un fragmento real devuelto por
 * showXmlExchangeRate.do el 27/09/2026, con los nombres de país y etiquetas
 * que usa la fuente en producción.
 */
class BacExchangeRateClientTest {

    private static final String XML_COSTA_RICA = """
            <?xml version="1.0" encoding="ISO-8859-1"?>
            <exchangeRates>
                <country>
                    <name>Costa Rica</name>
                    <buyRateUSD>448.000000</buyRateUSD>
                    <saleRateUSD>462.000000</saleRateUSD>
                    <buyRateEUR>508.460000</buyRateEUR>
                    <saleRateEUR>527.920000</saleRateEUR>
                    <link></link>
                </country>
            </exchangeRates>
            """;

    private static final String XML_SIN_COSTA_RICA = """
            <?xml version="1.0" encoding="ISO-8859-1"?>
            <exchangeRates>
                <country>
                    <name>Guatemala</name>
                    <buyRateUSD>7.440000</buyRateUSD>
                    <saleRateUSD>7.840000</saleRateUSD>
                    <buyRateEUR>7.890000</buyRateEUR>
                    <saleRateEUR>9.720000</saleRateEUR>
                </country>
            </exchangeRates>
            """;

    private static final String XML_TASA_VACIA = """
            <?xml version="1.0" encoding="ISO-8859-1"?>
            <exchangeRates>
                <country>
                    <name>Costa Rica</name>
                    <buyRateUSD>448.000000</buyRateUSD>
                    <saleRateUSD></saleRateUSD>
                    <buyRateEUR>508.460000</buyRateEUR>
                    <saleRateEUR>527.920000</saleRateEUR>
                </country>
            </exchangeRates>
            """;

    private final BacExchangeRateClient client = new BacExchangeRateClient(
            "https://www.sucursalelectronica.com/exchangerate/showXmlExchangeRate.do");

    @Test
    @DisplayName("Lee las cuatro tasas de Costa Rica conservando los seis decimales")
    void extractsTheCostaRicaRates() {
        ExchangeRates rates = client.extractCostaRicaRates(XML_COSTA_RICA);

        assertEquals(0, new BigDecimal("448.000000").compareTo(rates.usdBuy()));
        assertEquals(0, new BigDecimal("462.000000").compareTo(rates.usdSell()));
        assertEquals(0, new BigDecimal("508.460000").compareTo(rates.eurBuy()));
        assertEquals(0, new BigDecimal("527.920000").compareTo(rates.eurSell()));
        assertEquals("BAC Credomatic", rates.source());
        assertEquals(6, rates.usdBuy().scale());
    }

    @Test
    @DisplayName("Falla cuando la fuente no publica el país buscado")
    void failsIfTheCountryIsMissing() {
        assertThrows(IllegalStateException.class, () -> client.extractCostaRicaRates(XML_SIN_COSTA_RICA));
    }

    @Test
    @DisplayName("Falla antes de guardar si alguna tasa viene vacía")
    void failsIfAnyRateIsEmpty() {
        assertThrows(IllegalStateException.class, () -> client.extractCostaRicaRates(XML_TASA_VACIA));
    }
}
