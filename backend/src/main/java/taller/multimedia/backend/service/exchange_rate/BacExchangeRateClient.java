package taller.multimedia.backend.service.exchange_rate;

import java.io.StringReader;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;

import taller.multimedia.backend.dto.exchange_rate.ExchangeRates;

/**
 * Adaptador a la fuente de tasas de BAC Credomatic. Es el único lugar del
 * proyecto que sabe que esa fuente existe: descarga el XML y lo traduce a
 * {@link ExchangeRates}. No toca la base de datos.
 */
@Component
public class BacExchangeRateClient {

    static final String XPATH_COUNTRY = "//country[name='Costa Rica']";

    static final String TAG_USD_BUY = "buyRateUSD";
    static final String TAG_USD_SELL = "saleRateUSD";
    static final String TAG_EUR_BUY = "buyRateEUR";
    static final String TAG_EUR_SELL = "saleRateEUR";

    static final String SOURCE_BAC = "BAC Credomatic";

    private static final int CONNECT_TIMEOUT_MS = (int) Duration.ofSeconds(10).toMillis();
    private static final int READ_TIMEOUT_MS = (int) Duration.ofSeconds(15).toMillis();

    private final String url;
    private final RestTemplate restTemplate;

    public BacExchangeRateClient(@Value("${exchange-rate.bac.url}") String url) {
        this.url = url;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        requestFactory.setReadTimeout(READ_TIMEOUT_MS);
        this.restTemplate = new RestTemplate(requestFactory);
    }

    /**
     * Descarga el XML crudo de la fuente. El XML declara ISO-8859-1 y así lo
     * anuncia el header Content-Type, por eso el RestTemplate lo decodifica
     * con ese charset y el parser recibe un String ya decodificado.
     */
    public String downloadXml() {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.USER_AGENT, "Java/" + System.getProperty("java.version"));
        headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_XML_VALUE);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class).getBody();
    }

    /**
     * Extrae las tasas de Costa Rica del XML. Lanza si el país no aparece o si
     * alguna de las cuatro tasas viene vacía, para no guardar un registro con
     * datos a medias.
     */
    public ExchangeRates extractCostaRicaRates(String xml) {
        Document document;
        try {
            document = createSecureParser().newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo leer el XML de BAC: " + e.getMessage(), e);
        }

        XPath xpath = XPathFactory.newInstance().newXPath();
        Node countryNode;
        try {
            countryNode = (Node) xpath.evaluate(XPATH_COUNTRY, document, XPathConstants.NODE);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo buscar Costa Rica en el XML de BAC: " + e.getMessage(), e);
        }

        if (countryNode == null) {
            throw new IllegalStateException("No se encontró el nodo 'Costa Rica' en el XML de BAC");
        }

        try {
            return new ExchangeRates(
                    LocalDate.now(),
                    readRate(xpath, countryNode, TAG_USD_BUY),
                    readRate(xpath, countryNode, TAG_USD_SELL),
                    readRate(xpath, countryNode, TAG_EUR_BUY),
                    readRate(xpath, countryNode, TAG_EUR_SELL),
                    SOURCE_BAC);
        } catch (Exception e) {
            throw new IllegalStateException("El XML de BAC no trae las cuatro tasas esperadas: " + e.getMessage(), e);
        }
    }

    /**
     * Parser sin DTD ni entidades externas: el XML viene de un tercero y nunca
     * necesita resolver referencias externas.
     */
    private DocumentBuilderFactory createSecureParser() throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
        factory.setXIncludeAware(false);
        factory.setExpandEntityReferences(false);
        return factory;
    }

    private BigDecimal readRate(XPath xpath, Node context, String tag) throws Exception {
        String value = ((String) xpath.evaluate(tag, context, XPathConstants.STRING)).trim();
        if (value.isEmpty()) {
            throw new IllegalStateException("La etiqueta <" + tag + "> vino vacía");
        }
        return new BigDecimal(value);
    }
}
