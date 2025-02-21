import { useState, SyntheticEvent, useEffect } from "react";
import { TextField, InputLabel, MenuItem, Select, Grid, Button, SelectChangeEvent, Input } from '@mui/material';
import { EntryWithoutId, HealthCheckRating, EntryType, Diagnosis } from "../../types";
import diagnosisService from '../../services/diagnoses';

interface Props {
  onCancel: () => void;
  onSubmit: (values: EntryWithoutId) => void;
}

interface EntryTypeOption {
  value: EntryType;
  label: string;
}

interface HealthCheckRatingOption {
  value: HealthCheckRating;
  label: string;
}

type HealthCheckRatingKeys = keyof typeof HealthCheckRating;

const entryTypeOptions: EntryTypeOption[] = Object.values(EntryType).map(v => ({
  value: v, label: v.toString()
}));

const healthCheckRatingOptions: HealthCheckRatingOption[] = Object.values(HealthCheckRating).map(v => ({
  value: v as HealthCheckRating, label: v.toString()
})).filter((v) => {
  return typeof v.value === "string";
});

interface StateProps {
  diagnosisCodesState: [
    string[],
    React.Dispatch<React.SetStateAction<string[]>>
  ];
}

const MultipleSelect: React.FC<StateProps> = ({ diagnosisCodesState: [diagnosisCodes, setDiagnosisCodes] }) => {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>();

  useEffect(() => {
    const fetchDiagnoses = async () => {
      const diagnoses = await diagnosisService.getAll();
      setDiagnoses(diagnoses);
    };
    void fetchDiagnoses();
  }, []);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setDiagnosisCodes(
      typeof value === "string" ? value.split(',') : value,
    );
  };

  return (
    <div>
      <InputLabel>Diagnosis codes</InputLabel>
      <Select
        label="Diagnosis codes"
        multiple
        fullWidth
        value={diagnosisCodes}
        onChange={handleChange}
      >
        {diagnoses?.map((d) => (
          <MenuItem
            key={d.code}
            value={d.code}
          >
            {d.code}: {d.name}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
};

const AddEntryForm = ({ onCancel, onSubmit }: Props) => {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [specialist, setSpecialist] = useState('');
  const [diagnosisCodes, setDiagnosisCodes] = useState<string[]>([]);
  const [type, setType] = useState<EntryType>(EntryType.HealthCheck); // or <EntryWithoutId["type"]>
  //const [healthCheckRating, setHealthCheckRating] = useState<HealthCheckRating>(HealthCheckRating.Healthy);
  const [healthCheckRatingValue, setHealthCheckRatingValue] = useState<HealthCheckRating>(HealthCheckRating.Healthy);
  const [healthCheckRatingKeys, setHealthCheckRatingKeys] = useState<HealthCheckRatingKeys>("Healthy");
  const [sickLeaveStartDate, setSickLeaveStartDate] = useState('');
  const [sickLeaveEndDate, setSickLeaveEndDate] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [dischargeCriteria, setDischargeCriteria] = useState('');

  const onEventTypeChange = (event: SelectChangeEvent<string>) => {
    event.preventDefault();
    if ( typeof event.target.value === "string") {
      const value = event.target.value;
      const type = Object.values(EntryType).find(t => t.toString() === value);
      if (type) {
        setType(type);
      }
    }
  };

  const onHealthCheckRatingChange = (event: SelectChangeEvent<string>) => {
    event.preventDefault();
    if ( typeof event.target.value === "string") {
      const value = event.target.value;
      const rating = Object.values(HealthCheckRating).find(r => r.toString() === value);

      if (rating) {
        setHealthCheckRatingKeys(rating as HealthCheckRatingKeys);
        switch (rating) {
          case "Healthy":
            setHealthCheckRatingValue(HealthCheckRating.Healthy);
            break;
          case "LowRisk":
            setHealthCheckRatingValue(HealthCheckRating.LowRisk);
            break;
          case "HighRisk":
            setHealthCheckRatingValue(HealthCheckRating.HighRisk);
            break;
          case "CriticalRisk":
            setHealthCheckRatingValue(HealthCheckRating.CriticalRisk);
            break;
          default:
            throw new Error("Error setting health check rating");
        }
      }
    }
  };

  const addEntry = (event: SyntheticEvent) => {
    event.preventDefault();
    switch (type) {
      case "HealthCheck":
        onSubmit({
          description,
          date,
          specialist,
          diagnosisCodes: diagnosisCodes.length > 0 ? diagnosisCodes : undefined,
          type,
          healthCheckRating: healthCheckRatingValue
        });
        break;
      case "OccupationalHealthcare":
        onSubmit({
          description,
          date,
          specialist,
          diagnosisCodes: diagnosisCodes.length > 0 ? diagnosisCodes : undefined,
          type,
          employerName,
          sickLeave: sickLeaveStartDate. length > 0 ? {startDate: sickLeaveStartDate, endDate: sickLeaveEndDate} : undefined
        });
        break;
      case "Hospital":
        onSubmit({
          description,
          date,
          specialist,
          diagnosisCodes: diagnosisCodes.length > 0 ? diagnosisCodes : undefined,
          type,
          discharge: {date: dischargeDate, criteria: dischargeCriteria}
        });
        break;
      default:
        throw new Error("Error submitting entry");
    }
  };

  return (
    <div>
      <form onSubmit={addEntry}>
        <InputLabel>Type of visit</InputLabel>
        <Select
          style={{ marginBottom: 20 }}
          label="Type"
          fullWidth
          value={type}
          onChange={onEventTypeChange}
        >
        {entryTypeOptions.map(option =>
          <MenuItem
            key={option.label}
            value={option.value}
          >
            {option.label}
          </MenuItem>
        )}
        </Select>
        <TextField
          label="Description"
          fullWidth
          required
          value={description}
          onChange={({ target }) => setDescription(target.value)}
        />
        <TextField
          fullWidth
          required
          type="date"
          value={date}
          onChange={({ target }) => setDate(target.value)}
        />
        <TextField
          label="Specialist"
          fullWidth
          required
          value={specialist}
          onChange={({ target }) => setSpecialist(target.value)}
        />
        <MultipleSelect diagnosisCodesState={[diagnosisCodes, setDiagnosisCodes]} />

        {type === EntryType.OccupationalHealthcare && (
          <>
            <TextField
              label="Employer Name"
              fullWidth
              required
              value={employerName}
              onChange={({ target }) => setEmployerName(target.value)}
            />
            <InputLabel style={{ marginTop: 10 }}>Sick Leave Start and End Dates</InputLabel>
            <TextField
              fullWidth
              type="date"
              value={sickLeaveStartDate}
              onChange={({ target }) => setSickLeaveStartDate(target.value)}
            />
            <TextField
              fullWidth
              type="date"
              value={sickLeaveEndDate}
              onChange={({ target }) => setSickLeaveEndDate(target.value)}
            />
          </>
        )}

        {type === EntryType.Hospital && (
          <>
            <InputLabel style={{ marginTop: 10 }}>Discharge Date and Criteria</InputLabel>
            <TextField
              fullWidth
              required
              type="date"
              value={dischargeDate}
              onChange={({ target }) => setDischargeDate(target.value)}
            />
            <TextField
              label="Discharge Criteria"
              fullWidth
              required
              value={dischargeCriteria}
              onChange={({ target }) => setDischargeCriteria(target.value)}
            />
          </>
        )}

        {type === EntryType.HealthCheck && (
          <>
          <InputLabel style={{ marginTop: 20 }}>Health check rating</InputLabel>
          <Select
            label="Health Check Rating"
            fullWidth
            required
            value={healthCheckRatingKeys}
            onChange={onHealthCheckRatingChange}
          >
          {healthCheckRatingOptions.map(option =>
            <MenuItem
              key={option.label}
              value={option.value}
            >
              {option.label}
            </MenuItem>
          )}
          </Select>
          </>
        )}

        <Grid>
          <Grid item>
            <Button
              color="secondary"
              variant="contained"
              style={{ float: "left" }}
              type="button"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </Grid>
          <Grid item>
            <Button
              style={{
                float: "right",
              }}
              type="submit"
              variant="contained"
            >
              Add entry
            </Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
};

export default AddEntryForm;