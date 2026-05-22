import { AccountSwitcher01 } from "./account-switcher-01";
import {
  ACCOUNT_SWITCHER_01_DUMMY_ACTIVE_KEY,
  ACCOUNT_SWITCHER_01_DUMMY_ITEMS,
} from "./dummy-data";

// Real demos land at C6. C1 stub keeps tsc green.
export default function AccountSwitcher01Demo() {
  return (
    <AccountSwitcher01
      items={ACCOUNT_SWITCHER_01_DUMMY_ITEMS}
      activeKey={ACCOUNT_SWITCHER_01_DUMMY_ACTIVE_KEY}
      onSelect={() => {}}
    />
  );
}
