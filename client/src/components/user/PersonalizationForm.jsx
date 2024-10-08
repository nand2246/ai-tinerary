import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Slider,
  Typography,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  OutlinedInput,
  Card,
  useMediaQuery,
  DialogActions,
} from "@mui/material";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { updatePreferences } from "../../redux/authSlice";

function FormQuestion({ question, children }) {
  return (
    <Grid item xs={12}>
      <Card variant="outlined" sx={{ p: 2 }}>
        <Typography sx={{ mb: 1 }}>{question}</Typography>
        {children}
      </Card>
    </Grid>
  );
}

const PersonalizationForm = ({ open, handleClose, initialFormValues }) => {
  const dispatch = useDispatch();
  const [formValues, setFormValues] = useState({
    kids: initialFormValues.kids ? initialFormValues.kids : undefined,
    pets: initialFormValues.pets ? initialFormValues.pets : undefined,
    budget: initialFormValues.budget ? initialFormValues.budget : undefined,
    peopleInParty: initialFormValues.peopleInParty
      ? initialFormValues.peopleInParty
      : undefined,
    locationPreference: initialFormValues.locationPreference
      ? initialFormValues.locationPreference
      : undefined,
    activityPreference: initialFormValues.activityPreference
      ? initialFormValues.activityPreference
      : undefined,
    culinaryPreference: initialFormValues.culinaryPreference
      ? initialFormValues.culinaryPreference
      : undefined,
    explorationPreference: initialFormValues.explorationPreference
      ? initialFormValues.explorationPreference
      : undefined,
    nightlifeImportance: initialFormValues.nightlifeImportance
      ? initialFormValues.nightlifeImportance
      : undefined,
    culturalInterest: initialFormValues.culturalInterest
      ? initialFormValues.culturalInterest
      : undefined,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleReset = (name) => {
    setFormValues({ ...formValues, [name]: undefined });
  };

  const handleSubmit = () => {
    dispatch(updatePreferences(formValues));
    handleClose();
  };

  // used for changing format on mobiles
  const xs = useMediaQuery("(min-width:600px)");

  const renderButtonGroup = (field, options) => {
    return (
      <>
        <ToggleButtonGroup
          orientation={xs ? `horizontal` : `vertical`}
          value={formValues[field]}
          onChange={(event, newValue) => {
            setFormValues({ ...formValues, [field]: newValue });
          }}
          exclusive
          fullWidth
        >
          {options.map((option) => (
            <ToggleButton
              key={option}
              value={option}
              sx={{
                transition: "300ms",
                "&.MuiToggleButtonGroup-grouped": {
                  borderRadius: "4px !important",
                  border: "1px solid lightgrey !important",
                  m: 0.5,
                },
                "&.Mui-selected": {
                  color: "#fff",
                  backgroundColor: "primary.main",
                  "&:hover": {
                    color: "#fff",
                    backgroundColor: "primary.main",
                  },
                },
              }}
            >
              {option}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button sx={{ mt: 1 }} onClick={() => handleReset(field)}>
          Reset
        </Button>
      </>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle textAlign={"center"}>
        Personalize Your Experience
      </DialogTitle>

      {/* form questions */}
      <DialogContent>
        <Grid container spacing={2} sx={{ textAlign: "center" }}>
          <FormQuestion question={`Are you traveling with any kids?`}>
            {renderButtonGroup("kids", ["Yes", "No"])}
          </FormQuestion>
          <FormQuestion question={`Will you be bringing any pets along?`}>
            {renderButtonGroup("pets", ["Yes", "No"])}
          </FormQuestion>
          <FormQuestion
            question={`How many people do you usually travel with?`}
          >
            <Slider
              value={
                formValues.peopleInParty ? Number(formValues.peopleInParty) : 1
              }
              name="peopleInParty"
              valueLabelDisplay="auto"
              step={1}
              min={1}
              max={10}
              onChange={handleInputChange}
              sx={{ width: "90%" }}
            />
            <Button sx={{ mt: 1 }} onClick={() => handleReset("peopleInParty")}>
              Reset
            </Button>
          </FormQuestion>
          <FormQuestion
            question={`Would you rather explore bustling cities or tranquil countryside?`}
          >
            {renderButtonGroup("locationPreference", ["City", "Countryside"])}
          </FormQuestion>
          <FormQuestion
            question={`What type of activities do you enjoy the most?`}
          >
            {renderButtonGroup("activityPreference", [
              "Adventure",
              "Relaxation",
            ])}
          </FormQuestion>
          <FormQuestion
            question={`What kind of culinary experiences are you interested in?`}
          >
            {renderButtonGroup("culinaryPreference", [
              "Fine Dining",
              "Local Cuisine",
            ])}
          </FormQuestion>
          <FormQuestion
            question={`Do you prefer structured tours or independent exploration?`}
          >
            {renderButtonGroup("explorationPreference", [
              "Structured tours",
              "Independent exploration",
            ])}
          </FormQuestion>
          <FormQuestion
            question={`How important is nightlife to your travel plans?`}
          >
            {renderButtonGroup("nightlifeImportance", [
              "Very important",
              "Somewhat important",
              "Not important",
            ])}
          </FormQuestion>
          <FormQuestion>
            <Typography>
              Do you have a strong interest in local culture?
            </Typography>
            {renderButtonGroup("culturalInterest", ["Yes", "No"])}
          </FormQuestion>
          <FormQuestion>
            <Typography>Budget per day (USD):</Typography>
            <Grid container alignContent="center" justifyContent="center">
              <Grid item xs={10} sx={{ alignContent: "center" }}>
                <Slider
                  value={formValues.budget ? Number(formValues.budget) : 100}
                  name="budget"
                  onChange={handleInputChange}
                  aria-labelledby="budget-slider"
                  min={100}
                  max={5000}
                  step={10}
                  sx={{ width: "90%" }}
                />
              </Grid>
              <Grid item xs={2}>
                <OutlinedInput
                  value={formValues.budget ? formValues.budget : ""}
                  name="budget"
                  onChange={(e) => {
                    if (e.target.value > 5000) e.target.value = 5000;
                    else if (e.target.value < 100) e.target.value = 100;
                    handleInputChange(e);
                  }}
                  type="number"
                  inputProps={{
                    step: "10",
                    type: "number",
                  }}
                  sx={{ height: "100%" }}
                />
              </Grid>
            </Grid>
            <Button sx={{ mt: 1 }} onClick={() => handleReset("budget")}>
              Reset
            </Button>
          </FormQuestion>
        </Grid>
      </DialogContent>

      {/* action buttons */}
      <DialogActions sx={{ pt: 1, boxShadow: "0px -1px 5px lightgrey" }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button fullWidth variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button fullWidth variant="contained" onClick={handleSubmit}>
              Submit
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

FormQuestion.propTypes = {
  question: PropTypes.string,
  children: PropTypes.node,
};

PersonalizationForm.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  initialFormValues: PropTypes.object,
};

export default PersonalizationForm;
