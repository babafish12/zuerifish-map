package ch.zuerifish.map;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class AppIdentityTest {

    @Test
    public void packageIdMatchesCapacitorConfig() {
        assertEquals("ch.zuerifish.map", MainActivity.class.getPackageName());
    }
}
