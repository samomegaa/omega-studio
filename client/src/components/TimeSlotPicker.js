import React, { useState, useEffect } from 'react';
import { Box, Grid, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { format } from 'date-fns';
import bookingService from '../services/bookingService';

function TimeSlotPicker({ date, serviceType, duration, onSelectSlot, selectedSlot }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (date && serviceType && duration) {
      fetchAvailableSlots();
    }
  }, [date, serviceType, duration]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingService.getAvailableSlots(date, serviceType, duration);
      setSlots(response.slots);
    } catch (err) {
      setError(err.message || 'Error loading time slots');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const availableSlots = slots.filter(slot => slot.available);

  if (slots.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        Please select a date and duration to see available time slots.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Available Time Slots for {format(date, 'MMMM d, yyyy')}
      </Typography>
      
      {availableSlots.length === 0 ? (
        <Alert severity="warning">
          No available time slots for this date. Please try another date.
        </Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {availableSlots.length} time slot{availableSlots.length > 1 ? 's' : ''} available
          </Typography>
          
          <Grid container spacing={1} sx={{ mt: 1 }}>
            {slots.map((slot, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Button
                  variant={selectedSlot === slot.display ? "contained" : "outlined"}
                  disabled={!slot.available}
                  fullWidth
                  onClick={() => slot.available && onSelectSlot(slot)}
                  sx={{
                    py: 1,
                    bgcolor: !slot.available ? 'action.disabledBackground' : undefined,
                    '&:disabled': {
                      color: 'text.disabled'
                    }
                  }}
                >
                  {slot.display}
                </Button>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}

export default TimeSlotPicker;
