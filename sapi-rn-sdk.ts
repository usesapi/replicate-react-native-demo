import fetchIntercept from "fetch-intercept";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAPI_API_BASE_URL = "https://api.usesapi.com/";
const SAPI_PROXY_HOST = "proxy.usesapi.com";

interface SapiCreateTokenResponse {
  token: string;
  expiresAt: string;
}

class Sapi {
  private sapiId: string | null = null;
  private proxyHost: string | null = null;
  private tokenOwner: string | null = null;
  private platform: string | null = null;
  private expirationThresholdMs = 60 * 1000;
  private requireAuth: boolean | null = null;
  private apiHost: string | null = null;

  init({
    sapiId,
    tokenOwner = "anonymous",
    platform = "app",
    requireAuth = false,
  }: {
    sapiId: string;
    tokenOwner?: string;
    platform?: string;
    requireAuth?: boolean;
  }) {
    this.sapiId = sapiId;
    this.proxyHost = `${sapiId}.${SAPI_PROXY_HOST}`;
    this.tokenOwner = tokenOwner;
    this.platform = platform;
    this.requireAuth = requireAuth;
    this.apiHost = decodeHost(sapiId);

    this.registerFetchIntercept();
    if (this.requireAuth) {
      return;
    }
    (async () => {
      const isTokenValid = await this.isTokenValid();
      if (!isTokenValid) {
        this.refreshToken().catch(console.error);
      } else {
        const tokenData = await this.getLocalSapiTokenData();
        const ms =
          new Date(tokenData!.expiresAt).getTime() -
          Date.now() -
          this.expirationThresholdMs;
        setTimeout(() => {
          this.refreshToken().catch(console.error);
        }, ms);
      }
    })();
  }

  public async authToken(auth: { type: "captcha"; value: string }) {
    const data = await this.fetchToken(auth);
    this.setLocalSapiTokenData(data);
  }

  private getStorageKey = () => {
    return `__sapi_token_${this.proxyHost}`;
  };

  private registerFetchIntercept = () => {
    fetchIntercept.register({
      request: async (url, config) => {
        try {
          if (!this.apiHost || !url.includes(this.apiHost)) {
            return [url, config];
          }

          const tokenValid = await isTokenValid();
          if (!tokenValid) {
            await this.fetchToken();
          }
          const proxyUrl = url.replace(this.apiHost, this.proxyHost!);
          const localToken = await this.getLocalSapiTokenData();

          const headers = {
            ...(config.headers || {}),
            Authorization: `Bearer ${localToken!.token}`,
          };
          return [
            proxyUrl.toString(),
            {
              ...config,
              headers,
            },
          ];
        } catch (e) {
          console.log(e);
          return [url, config];
        }
      },
    });
  };

  private refreshToken = async () => {
    try {
      const data = await this.fetchToken();
      this.setLocalSapiTokenData(data);
      const toms =
        new Date(data.expiresAt).getTime() -
        Date.now() -
        this.expirationThresholdMs;

      setTimeout(() => {
        this.refreshToken();
      }, toms);
    } catch (e) {
      console.error(e);
    }
  };

  private fetchToken = async (auth?: { type: string; value: string }) => {
    const res = await fetch(
      `${SAPI_API_BASE_URL}v1/token?code=${this.sapiId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(auth ? { auth } : {}),
          tokenOwner: this.tokenOwner,
          metadata: {
            platform: this.platform,
          },
        }),
      }
    );
    if (res.status >= 400) {
      throw new Error("Error while trying to create a Sapi token.");
    }
    const json = await res.json();
    const token = json["token"];
    const expiresAt = json["expiresAt"];
    return { token, expiresAt };
  };

  private getLocalSapiTokenData =
    async (): Promise<SapiCreateTokenResponse | null> => {
      const localData = await AsyncStorage.getItem(this.getStorageKey());
      if (!localData) {
        return null;
      }
      return JSON.parse(localData);
    };

  private setLocalSapiTokenData = (data: SapiCreateTokenResponse) =>
    AsyncStorage.setItem(this.getStorageKey(), JSON.stringify(data));

  public isTokenValid = async () => {
    const localData = await this.getLocalSapiTokenData();
    if (!localData) {
      return false;
    }
    return (
      localData.expiresAt >
      new Date(Date.now() + this.expirationThresholdMs).toISOString()
    );
  };
}

const decodeHost = (input: string): string => {
  const host = input.split(".")[0].replace(/--/g, "@@@@@@");
  const parts = host.split("-");
  parts.pop();
  return parts.join(".").replace(/@@@@@@/g, "-");
};

const sapi = new Sapi();

const init = sapi.init.bind(sapi);
const authToken = sapi.authToken.bind(sapi);
const isTokenValid = sapi.isTokenValid.bind(sapi);

export { init, authToken, isTokenValid };
